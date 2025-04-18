import axios from 'axios';
import Config from 'react-native-config';
import {Linking} from 'react-native';
// Remove AsyncStorage import since we're using Firestore now
// import AsyncStorage from '@react-native-async-storage/async-storage';
// Replace uuid import with custom implementation
// import {v4 as uuidv4} from 'uuid';
import {DeepLinkHandler} from '../navigation/DeepLinkHandler';
import {
  LexAIMessage,
  LexAIConversation,
  LexAIResponse,
  LexAITool,
  LexAIToolCall,
  WebSearchResult,
  LexAIPersonality,
  LexAIMode,
  PERSONALITIES,
} from '../types/lexAITypes';
import {TaskService} from './firebase/TaskService';
import LexAIFirestoreService from './firebase/LexAIFirestoreService';
import {Task} from '../types/taskTypes';
import auth from '@react-native-firebase/auth';
import {Message} from '../models/Message';
// import {useNavigation} from '@react-navigation/native';
/**
 * Custom UUID generator that doesn't rely on crypto.getRandomValues()
 */
const generateUUID = (): string => {
  // Use a timestamp-based prefix to ensure uniqueness
  const timestamp = Date.now().toString(36);

  // Generate random segments
  const randomSegment1 = Math.random().toString(36).substring(2, 15);
  const randomSegment2 = Math.random().toString(36).substring(2, 15);

  // Combine timestamp and random segments to form a UUID-like string
  return `${timestamp}-${randomSegment1}-${randomSegment2}`;
};

/**
 * LexAI Service - Handles communication with Gemini API and implements agentic capabilities
 */
class LexAIService {
  private API_KEY = Config.GEMINI_API_KEY;
  private API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private taskService: TaskService;
  private systemPrompt: string;
  private availableTools: LexAITool[];
  // Use a safe default if PERSONALITIES is undefined
  private personality: LexAIPersonality = PERSONALITIES?.FRIENDLY_COMPANION || {
    id: 'friendly_companion',
    name: 'Friendly Companion',
    traits: ['casual', 'conversational', 'humorous'],
    description:
      'Uses a casual tone with occasional humor, making learning feel like talking with a friend.',
  };
  private mode: LexAIMode = LexAIMode.AGENT;

  constructor() {
    this.taskService = new TaskService();
    this.systemPrompt = this.generateSystemPrompt();
    this.availableTools = this.defineTools();
  }

  /**
   * Define the available tools for LexAI
   */
  private defineTools(): LexAITool[] {
    return [
      {
        name: 'navigate',
        description:
          'Navigate to a specific screen in the application. Call this directly when a user asks to navigate, go to a screen, or open a section of the app. Valid screen names are: "Home", "Search", "CreatePost" (these are in the Tab Navigator), "Tasks", "Room","EventsAndHackathons", "Conversations", "ContactList", "SavedPosts", "QRCode". For "Home", "Search", and "CreatePost" screens, they need special navigation via "Tabs" navigator.',
        parameters: {
          screenName: 'string - The name of the screen to navigate to',
          params: 'object - Optional parameters to pass to the screen',
        },
      },
      {
        name: 'searchPosts',
        description:
          'Search for posts using a keyword or phrase. Call this when user wants to find posts or content within the app.',
        parameters: {
          query: 'string - The search term to look for in posts',
        },
      },
      {
        name: 'getTasks',
        description:
          "Get the user's tasks. Call this when user asks about their tasks, to-dos, or upcoming activities.",
        parameters: {},
      },
      {
        name: 'addTask',
        description:
          "Add a new task to the user's task list. Call this immediately when a user mentions adding a task, creating a reminder, or setting up a to-do, even if only the title is provided. Default values will be used for missing parameters.",
        parameters: {
          title: 'string - The title of the task',
          description: 'string - Optional description of the task',
          dueDate: 'string - Due date in YYYY-MM-DD format',
          dueTime: 'string - Due time in HH:MM format (24-hour)',
          priority: 'string - Priority level: "low", "medium", or "high"',
          category: 'string - Category of the task',
          notify: 'boolean - Whether to send a notification for this task',
        },
      },
      {
        name: 'updateTask',
        description:
          'Update an existing task. Call this when user wants to modify, change, or update a task.',
        parameters: {
          taskName: 'string - The name of the task to update',
          title: 'string - Optional new title',
          description: 'string - Optional new description',
          dueDate: 'string - Optional new due date (YYYY-MM-DD)',
          dueTime: 'string - Optional new due time (HH:MM)',
          priority: 'string - Optional new priority',
          category: 'string - Optional new category',
          notify: 'boolean - Optional notification setting',
        },
      },
      {
        name: 'deleteTask',
        description:
          'Delete a task by its name. ALWAYS call this function immediately when the user asks to delete, remove, clear, or get rid of a task. Extract the task name from their request and pass it as the taskName parameter. If the task name is ambiguous, ask for clarification.',
        parameters: {
          taskName:
            'string - The exact name of the task to delete (not the ID). Must match exactly with an existing task name.',
        },
      },
      {
        name: 'toggleTaskCompletion',
        description:
          'Mark a task as complete or incomplete. Call this when user wants to mark a task as done or undone.',
        parameters: {
          taskName: 'string - The name of the task to toggle completion status',
        },
      },
      {
        name: 'createRoom',
        description:
          'Create a new meeting room with a specific title. Call this when user wants to create, set up, or make a meeting room.',
        parameters: {
          title: 'string - The title for the meeting room',
          description: 'string - Optional description for the meeting',
          isPrivate:
            'boolean - Whether the meeting is private (default: false)',
        },
      },
      {
        name: 'webSearch',
        description:
          'Search the web for information not available in the knowledge base. Call this IMMEDIATELY when user asks to search, look up, or find information online. Extract search terms from the user query.',
        parameters: {
          query: 'string - The search query to look up on the web',
        },
      },
      {
        name: 'openUrl',
        description:
          'Open a URL in the browser. Call this immediately when a user mentions opening a website, visiting a URL, or browsing to a specific site.',
        parameters: {
          url: 'string - The URL to open',
        },
      },
    ];
  }

  /**
   * Generate the system prompt based on personality and mode
   */
  private generateSystemPrompt(): string {
    // Basic introduction
    let basePrompt = `You are LexAI, a helpful AI assistant in the Learnex app.`;

    // Add personality traits from the configuration
    if (this.personality?.traits?.length) {
      basePrompt += ` Your personality is: ${this.personality.traits.join(
        ', ',
      )}.`;
    }

    // Add mode-specific instructions
    if (this.mode === LexAIMode.AGENT) {
      // Full agent mode instructions
      basePrompt += `
You have access to several capabilities to help the user:

1. You can help users navigate through the app with the "navigate" tool
2. You can search for posts in the app with the "searchPosts" tool
3. You can manage tasks using the "createTask", "updateTask", "deleteTask" tools
   - IMPORTANT: Always use the task NAME (not ID) for updating, deleting, or completing tasks
   - For example, use "deleteTask" with the parameter taskName: "Buy groceries" (not taskId)
   - Note that task names must be unique - you cannot create two tasks with the same name
   - If a user tries to create a task with a name that already exists, suggest using a more specific name
4. You can perform web searches using the "webSearch" tool
5. You can open URLs using the "openUrl" tool
6. You can create room on the app using the "createRoom" tool
7. You can help users understand how to use the app

Available app screens for navigation:
- Home - Main feed and dashboard
- Search - Find posts and users
- CreatePost - Create a new post
- Tasks - View and manage tasks/to-dos
- Room - View available meeting rooms
- EventsAndHackathons - View upcoming events
- LexAI - Access this AI assistant
- Conversations - Chat and messaging
- SavedPosts - View bookmarked content
- QRCode - Scan QR codes

Think step by step. First understand what the user is asking, then determine if you need to use a tool or if you can simply answer their question.
For simple factual questions or general discussions, respond directly.
For app-specific actions, use the appropriate tool.

Remember:
- Be concise but helpful
- When working with tasks, always use the task NAME (not ID) for all operations
- When opening URLs, let the user know you'll open it for them
- Prioritize using app functions over web search when possible
- Maintain a friendly, conversational tone
`;
    } else {
      // Simple chat mode instructions
      basePrompt += `
You are in simple chat mode, focused on being a helpful conversational assistant.

In this mode:
1. You can engage in general discussion and answer factual questions
2. You can suggest relevant web searches when you're uncertain
3. You can provide links to websites with the "openUrl" tool, but these will display in chat rather than automatically opening
4. You cannot directly manipulate the app (no task creation, navigation, etc.)

Focus on being a good conversational partner. Be friendly, informative, and concise.
When the user would benefit from a web resource, you can share links that will be displayed in the chat.
`;
    }

    // Add closing instructions
    basePrompt += `
Avoid making up information. If you're unsure, clearly say so.
Always be helpful, respectful, and focused on the user's needs.`;

    return basePrompt;
  }

  /**
   * Set LexAI mode
   */
  public setMode(mode: LexAIMode): void {
    this.mode = mode;
    this.systemPrompt = this.generateSystemPrompt();
  }

  /**
   * Get current LexAI mode
   */
  public getMode(): LexAIMode {
    return this.mode;
  }

  /**
   * Set LexAI personality
   */
  public setPersonality(personality: LexAIPersonality): void {
    this.personality = personality;
    this.systemPrompt = this.generateSystemPrompt();
  }

  /**
   * Initialize a new conversation
   */
  public initConversation(
    title: string = 'New Conversation',
    mode: LexAIMode = this.mode,
  ): LexAIConversation {
    // Update current mode if provided
    if (mode !== this.mode) {
      this.setMode(mode);
    }

    const conversationId = generateUUID();
    const systemMessage: LexAIMessage = {
      id: generateUUID(),
      role: 'system',
      content: this.systemPrompt,
      timestamp: Date.now(),
    };

    return {
      id: conversationId,
      title,
      messages: [systemMessage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: this.mode,
    };
  }

  /**
   * Process a user message and get a response from the AI
   */
  public async processMessage(
    userMessage: string,
    conversation: LexAIConversation,
  ): Promise<LexAIResponse> {
    try {
      console.log(
        `LexAI :: processMessage() :: Processing user message: "${userMessage}"`,
      );

      // Set the mode to match the conversation's mode
      if (conversation.mode !== this.mode) {
        this.setMode(conversation.mode);
      }

      // Check if this is a confirmation message for a previous task deletion request
      const isConfirmationMessage = this.isConfirmationMessage(
        userMessage,
        conversation,
      );
      if (isConfirmationMessage && isConfirmationMessage.taskName) {
        console.log(
          `LexAI :: processMessage() :: Confirmation detected for task: "${isConfirmationMessage.taskName}"`,
        );

        const taskName = isConfirmationMessage.taskName;
        return this.handleConfirmedAction(
          {
            id: generateUUID(),
            toolName: 'deleteTask',
            parameters: {taskName},
          },
          conversation,
        );
      }

      // Check for direct function calls based on user message patterns
      const forcedToolCall = this.checkForForcedToolCalls(userMessage);
      if (forcedToolCall) {
        console.log(
          `LexAI :: processMessage() :: Forced tool call detected: ${forcedToolCall.toolName}`,
          JSON.stringify(forcedToolCall.parameters),
        );
        console.log(`LexAI :: processMessage() :: Current mode: ${this.mode}`);

        // Double-check that the forced tool call is allowed in the current mode
        if (
          this.mode === LexAIMode.SIMPLE_CHAT &&
          forcedToolCall.toolName !== 'webSearch' &&
          forcedToolCall.toolName !== 'openUrl'
        ) {
          console.log(
            `LexAI :: processMessage() :: Forced tool call "${forcedToolCall.toolName}" not allowed in SIMPLE_CHAT mode, using AI response instead`,
          );
          // Skip the forced tool call and continue with normal AI processing
        } else {
          // Execute the forced tool call
          console.log(
            `LexAI :: processMessage() :: Executing forced tool call: ${forcedToolCall.toolName}`,
          );
          const toolResult = await this.executeToolCall(forcedToolCall);
          console.log(
            `LexAI :: processMessage() :: Forced tool call result:`,
            JSON.stringify({
              toolName: toolResult.toolName,
              response: toolResult.response,
              error: toolResult.error,
            }),
          );

          // Process the result with another API call
          console.log(
            `LexAI :: processMessage() :: Processing forced tool call result`,
          );
          const followUpResponse = await this.processToolResult(
            toolResult,
            conversation,
          );
          console.log(
            `LexAI :: processMessage() :: Returning follow-up response from forced tool call`,
          );
          return followUpResponse;
        }
      } else {
        console.log(
          `LexAI :: processMessage() :: No forced tool call detected, proceeding with normal AI processing`,
        );
      }

      // Add user message to conversation
      const userMsg: LexAIMessage = {
        id: generateUUID(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };

      // Get messages for context (excluding system messages for API)
      const messages = conversation.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          parts: [{text: msg.content}],
        }));

      // Add new user message
      messages.push({
        role: 'user',
        parts: [{text: userMessage}],
      });

      // Prepare request for API
      const payload: any = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${
                  this.systemPrompt
                }\n\nHere's the conversation so far: ${JSON.stringify(
                  messages,
                )}\n\nPlease respond to the user's last message.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more deterministic function calls
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      };

      // Add tools to payload based on mode
      this.addToolsToPayload(payload);

      // Make API request without streaming
      console.log('LexAI :: processMessage() :: Sending request to Gemini API');

      // Log debug information about the request
      console.log('LexAI :: processMessage() :: Request details:');
      console.log(`  - Model: gemini-2.0-flash`);
      console.log(`  - Temperature: ${payload.generationConfig?.temperature}`);
      console.log(
        `  - Max output tokens: ${payload.generationConfig?.maxOutputTokens}`,
      );

      if (payload.tools && payload.tools.length > 0) {
        const functionNames = payload.tools[0].functionDeclarations
          .map((fn: any) => fn.name)
          .join(', ');
        console.log(
          `  - Available tools (${payload.tools[0].functionDeclarations.length}): ${functionNames}`,
        );
      }

      const response = await axios.post(
        `${this.API_URL}?key=${this.API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Process the response
      console.log(
        'LexAI :: processMessage() :: Received response from Gemini API',
      );

      // Debug logging for function calls
      if (response.data.candidates && response.data.candidates.length > 0) {
        const firstCandidate = response.data.candidates[0];
        console.log(
          'Response candidate:',
          JSON.stringify(firstCandidate, null, 2),
        );

        // Check for function call in any part of the response
        let foundFunctionCall = false;
        let functionCallPart = null;
        let functionCallIndex = -1;

        if (firstCandidate.content?.parts) {
          firstCandidate.content.parts.forEach((part: any, index: number) => {
            if (part.functionCall) {
              foundFunctionCall = true;
              functionCallPart = part.functionCall;
              functionCallIndex = index;
              console.log(`FUNCTION CALL DETECTED in parts[${index}]:`, {
                name: part.functionCall.name,
                args: JSON.stringify(part.functionCall.args, null, 2),
              });
            }
          });
        }

        if (!foundFunctionCall) {
          console.log(
            'NO FUNCTION CALL IN RESPONSE - Content parts:',
            JSON.stringify(firstCandidate.content?.parts, null, 2),
          );
        }
      } else {
        console.log('No candidates in response');
      }

      console.log(
        'Response structure:',
        JSON.stringify(response.data, null, 2),
      );

      const responseData = response.data;

      // Check if this response contains a function call in ANY part
      let functionCallData = null;
      let functionCallFound = false;

      console.log(
        'LexAI :: processMessage() :: Checking for function calls in response',
      );
      if (responseData.candidates?.[0]?.content?.parts) {
        const parts = responseData.candidates[0].content.parts;
        console.log(
          `LexAI :: processMessage() :: Response contains ${parts.length} parts`,
        );

        for (let i = 0; i < parts.length; i++) {
          console.log(
            `LexAI :: processMessage() :: Examining part ${i}: ${
              parts[i].text
                ? 'text content'
                : parts[i].functionCall
                ? 'function call'
                : 'unknown content'
            }`,
          );

          if (parts[i].functionCall) {
            functionCallFound = true;
            functionCallData = parts[i].functionCall;
            console.log(
              `LexAI :: processMessage() :: Found function call in part ${i}:`,
              JSON.stringify({
                name: parts[i].functionCall.name,
                args: parts[i].functionCall.args,
              }),
            );
            break;
          }
        }
      } else {
        console.log(
          'LexAI :: processMessage() :: No content parts found in response',
        );
      }

      if (functionCallFound && functionCallData) {
        console.log(
          `LexAI :: processMessage() :: Processing function call: ${functionCallData.name}`,
        );
        console.log(
          `LexAI :: processMessage() :: Function parameters:`,
          JSON.stringify(functionCallData.args || {}),
        );

        const toolCall: LexAIToolCall = {
          id: generateUUID(),
          toolName: functionCallData.name,
          parameters: functionCallData.args || {},
        };

        // Execute the function call
        console.log(
          `LexAI :: processMessage() :: Executing tool call: ${toolCall.toolName}`,
        );
        const toolResult = await this.executeToolCall(toolCall);
        console.log('LexAI :: processMessage() :: Tool execution result:', {
          toolName: toolCall.toolName,
          parameters: toolCall.parameters,
          response: toolResult.response ? 'Success' : undefined,
          error: toolResult.error || undefined,
        });

        // Process the result with another API call
        console.log(
          `LexAI :: processMessage() :: Processing tool result for follow-up response`,
        );
        const followUpResponse = await this.processToolResult(
          toolResult,
          conversation,
        );
        console.log(
          `LexAI :: processMessage() :: Returning follow-up response from tool execution`,
        );

        return followUpResponse;
      } else {
        console.log(
          'LexAI :: processMessage() :: No function call found, processing as text response',
        );
        // Extract text content
        let textContent = '';
        if (responseData.candidates?.[0]?.content?.parts) {
          console.log('Processing text parts from response');
          console.log(
            'Parts:',
            JSON.stringify(responseData.candidates[0].content.parts),
          );

          for (const part of responseData.candidates[0].content.parts) {
            if (part.text) {
              textContent += part.text;
            }
          }

          console.log('Extracted text content length:', textContent.length);
        } else {
          console.log('No content parts found in response');
          console.log('Full response structure:', JSON.stringify(responseData));
        }

        // Provide a fallback message if no text is found
        if (!textContent.trim()) {
          console.log('No text content found, using fallback message');
          textContent =
            "I'm sorry, I couldn't generate a proper response. Please try asking in a different way.";
        }

        // No function call, just return the text response
        const aiMsg: LexAIMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: textContent,
          timestamp: Date.now(),
        };

        return {message: aiMsg};
      }
    } catch (error: any) {
      console.error('Error in LexAI processMessage:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error(
          'API response error:',
          JSON.stringify(error.response.data),
        );
      }
      throw error;
    }
  }

  /**
   * Add appropriate tools to the API payload based on current mode
   */
  private addToolsToPayload(payload: any): void {
    if (this.mode === LexAIMode.AGENT) {
      // Include all tools in agent mode
      payload.tools = [
        {
          functionDeclarations: this.availableTools.map(tool => {
            // Format each tool according to the Gemini API documentation
            const functionDeclaration: any = {
              name: tool.name,
              description: tool.description,
              parameters: {
                type: 'object',
                properties: {},
                required: [],
              },
            };

            // Convert parameters to the correct format
            Object.entries(tool.parameters).forEach(([key, value]) => {
              const description = value.toString();

              // Parse the parameter description to identify type
              const typeMatch = description.match(/^(.*?)\s+-\s+/);
              const typeStr = typeMatch ? typeMatch[1].toLowerCase() : 'string';

              // Check if parameter is required (doesn't contain "Optional")
              if (!description.includes('Optional')) {
                functionDeclaration.parameters.required.push(key);
              }

              // Set up property with appropriate type
              if (typeStr.includes('array')) {
                functionDeclaration.parameters.properties[key] = {
                  type: 'array',
                  items: {type: 'string'},
                  description: description,
                };
              } else if (typeStr.includes('boolean')) {
                functionDeclaration.parameters.properties[key] = {
                  type: 'boolean',
                  description: description,
                };
              } else if (typeStr.includes('number')) {
                functionDeclaration.parameters.properties[key] = {
                  type: 'number',
                  description: description,
                };
              } else if (typeStr.includes('object')) {
                functionDeclaration.parameters.properties[key] = {
                  type: 'object',
                  description: description,
                };
              } else {
                // Default to string for all other types
                functionDeclaration.parameters.properties[key] = {
                  type: 'string',
                  description: description,
                };
              }
            });

            return functionDeclaration;
          }),
        },
      ];

      // Set temperature for more reliable function calls (as recommended)
      if (!payload.generationConfig) {
        payload.generationConfig = {};
      }
      payload.generationConfig.temperature = Math.min(
        payload.generationConfig.temperature || 0.2,
        0.2,
      );
    } else {
      // In simple chat mode, only include webSearch and openUrl tools
      // Create specific declarations following the documentation format
      const webSearchDeclaration = {
        name: 'webSearch',
        description:
          'Search the web for information not available in the knowledge base',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to look up on the web',
            },
          },
          required: ['query'],
        },
      };

      const openUrlDeclaration = {
        name: 'openUrl',
        description: 'Open a URL in the browser',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to open',
            },
          },
          required: ['url'],
        },
      };

      payload.tools = [
        {
          functionDeclarations: [webSearchDeclaration, openUrlDeclaration],
        },
      ];

      // Set a low temperature for more deterministic function calls
      if (!payload.generationConfig) {
        payload.generationConfig = {};
      }
      payload.generationConfig.temperature = Math.min(
        payload.generationConfig.temperature || 0.2,
        0.2,
      );
    }

    // Log information about the tools being included
    console.log(`Adding tools to payload for ${this.mode} mode`);
    if (payload.tools && payload.tools[0].functionDeclarations) {
      console.log(
        `Number of tools: ${payload.tools[0].functionDeclarations.length}`,
      );
    }
  }

  /**
   * Execute a tool call and return the result
   */
  private async executeToolCall(
    toolCall: LexAIToolCall,
  ): Promise<LexAIToolCall> {
    try {
      const {toolName, parameters} = toolCall;

      // Allow only webSearch and openUrl in simple chat mode
      if (
        this.mode === LexAIMode.SIMPLE_CHAT &&
        toolName !== 'webSearch' &&
        toolName !== 'openUrl'
      ) {
        return {
          ...toolCall,
          error: `Tool ${toolName} is not available in simple chat mode. Only web search and URL opening are supported.`,
        };
      }

      switch (toolName) {
        case 'navigate':
          // Extra check specifically for navigation in SIMPLE_CHAT mode
          if (this.mode === LexAIMode.SIMPLE_CHAT) {
            console.log(
              'Navigation tool call attempted in SIMPLE_CHAT mode, rejecting',
            );
            return {
              ...toolCall,
              error: `Tool ${toolName} is not available in simple chat mode. Only web search and URL opening are supported.`,
            };
          }

          // Validate required parameters
          if (!parameters.screenName) {
            return {
              ...toolCall,
              error: 'Missing required parameter: screenName',
            };
          }

          try {
            // Normalize screen name to match UserStackParamList names
            // This handles variations like "home", "Home", "home screen", etc.
            const screenNameInput = parameters.screenName.trim();
            let normalizedScreenName = screenNameInput;

            // Convert first letter to uppercase for standard screens
            if (screenNameInput.length > 0) {
              const firstChar = screenNameInput.charAt(0).toUpperCase();
              const restOfString = screenNameInput
                .slice(1)
                .toLowerCase()
                .replace(/\s+screen$/, '');
              normalizedScreenName = firstChar + restOfString;
            }

            // Map common variations to exact screen names
            const screenNameMap: Record<string, string> = {
              home: 'Home',
              search: 'Search',
              create: 'CreatePost',
              createpost: 'CreatePost',
              'create post': 'CreatePost',
              post: 'CreatePost',
              lexai: 'LexAI',
              lex: 'LexAI',
              ai: 'LexAI',
              assistant: 'LexAI',
              tasks: 'Tasks',
              task: 'Tasks',
              todo: 'Tasks',
              todos: 'Tasks',
              'to-do': 'Tasks',
              'to-dos': 'Tasks',
              events: 'EventsAndHackathons',
              hackathons: 'EventsAndHackathons',
              event: 'EventsAndHackathons',
              'events and hackathons': 'EventsAndHackathons',
              eventdetails: 'EventDetails',
              'event details': 'EventDetails',
              room: 'Room',
              roomscreen: 'RoomScreen',
              'room screen': 'RoomScreen',
              rooms: 'Room',
              meetings: 'Room',
              meeting: 'Room',
              chat: 'Conversations',
              chats: 'Conversations',
              conversation: 'Conversations',
              conversations: 'Conversations',
              messages: 'Conversations',
              message: 'Conversations',
              saved: 'SavedPosts',
              'saved posts': 'SavedPosts',
              'saved post': 'SavedPosts',
              bookmarks: 'SavedPosts',
              qr: 'QRCode',
              qrcode: 'QRCode',
              'qr code': 'QRCode',
              scan: 'QRCode',
              contacts: 'ContactList',
              'contact list': 'ContactList',
              contactlist: 'ContactList',
              profile: 'Profile',
            };

            // Get the correct screen name from the map or use the original (properly cased)
            const lowercaseScreenName = screenNameInput.toLowerCase().trim();
            const mappedScreenName =
              screenNameMap[lowercaseScreenName] || screenNameInput;

            // Handle special cases for tab navigation
            const tabScreens = ['Home', 'Search', 'CreatePost'];
            if (tabScreens.includes(mappedScreenName)) {
              DeepLinkHandler.navigate('Tabs', {screen: mappedScreenName});
              return {
                ...toolCall,
                response: {
                  success: true,
                  screenName: mappedScreenName,
                  originalInput: parameters.screenName,
                  message: `Navigated to ${mappedScreenName} tab`,
                },
              };
            }

            // Handle screens that may require parameters
            if (mappedScreenName === 'EventDetails' && parameters.params) {
              DeepLinkHandler.navigate(mappedScreenName, parameters.params);
              return {
                ...toolCall,
                response: {
                  success: true,
                  screenName: mappedScreenName,
                  originalInput: parameters.screenName,
                  message: `Navigated to ${mappedScreenName} with parameters`,
                },
              };
            }

            // Handle Room navigation with potential parameters
            if (
              (mappedScreenName === 'Room' ||
                mappedScreenName === 'RoomScreen') &&
              parameters.params
            ) {
              DeepLinkHandler.navigate(mappedScreenName, parameters.params);
              return {
                ...toolCall,
                response: {
                  success: true,
                  screenName: mappedScreenName,
                  originalInput: parameters.screenName,
                  message: `Navigated to ${mappedScreenName} with parameters`,
                },
              };
            }

            // Default navigation for other screens
            const success = DeepLinkHandler.navigate(
              mappedScreenName,
              parameters.params || {},
            );

            return {
              ...toolCall,
              response: {
                success,
                screenName: mappedScreenName,
                originalInput: parameters.screenName,
                message: success
                  ? `Navigated to ${mappedScreenName} screen`
                  : `Failed to navigate to ${mappedScreenName}`,
              },
            };
          } catch (error: any) {
            console.error('Navigation error:', error);
            return {
              ...toolCall,
              error: `Failed to navigate: ${error.message || 'Unknown error'}`,
            };
          }

        case 'searchPosts':
          // Provide default for query if missing
          const searchQuery = parameters.query || 'recent posts';

          try {
            // In the future, implement actual post search logic here
            return {
              ...toolCall,
              response: {
                message: `Searching for posts containing "${searchQuery}"`,
                query: searchQuery,
                // In a real implementation, you would return actual search results
                results: [],
              },
            };
          } catch (error: any) {
            console.error('Post search error:', error);
            return {
              ...toolCall,
              error: `Failed to search posts: ${
                error.message || 'Unknown error'
              }`,
            };
          }

        case 'getTasks':
          console.log('LexAI :: executeToolCall() :: Getting all tasks');
          const tasks = await this.taskService.getTasks();
          console.log(
            `LexAI :: executeToolCall() :: Found ${tasks.length} tasks`,
          );
          return {
            ...toolCall,
            response: {tasks},
          };

        case 'addTask':
          // Validate required parameter
          if (!parameters.title) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: title',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: title',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Creating task with title: "${parameters.title}"`,
          );

          // Smart defaults for task creation
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

          // Format date and time for default values
          const defaultDueDate = oneHourLater.toISOString().split('T')[0]; // YYYY-MM-DD
          const defaultDueTime = `${oneHourLater
            .getHours()
            .toString()
            .padStart(2, '0')}:${oneHourLater
            .getMinutes()
            .toString()
            .padStart(2, '0')}`; // HH:MM

          // Create task with defaults but prioritize explicit parameters
          try {
            console.log(
              'LexAI :: executeToolCall() :: Preparing task data with defaults',
            );
            const taskData = {
              title: parameters.title,
              description: parameters.description || '',
              dueDate: parameters.dueDate || defaultDueDate,
              dueTime: parameters.dueTime || defaultDueTime,
              priority: parameters.priority || 'medium',
              category: parameters.category || 'general',
              notify:
                parameters.notify !== undefined ? parameters.notify : true,
              completed: false,
              userId: '', // This will be set by the TaskService
            };
            console.log(
              'LexAI :: executeToolCall() :: Task data:',
              JSON.stringify(taskData),
            );

            const taskId = await this.taskService.addTask(taskData);
            console.log(
              `LexAI :: executeToolCall() :: Task created successfully with ID: ${taskId}`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskId,
                message: `Task "${parameters.title}" created${
                  parameters.dueDate
                    ? ` for ${parameters.dueDate}`
                    : ' for today'
                }.`,
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error creating task: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to create task: ${error.message}`,
            };
          }

        case 'updateTask':
          // Validate required parameter for update
          if (!parameters.taskName) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: taskName',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: taskName',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Updating task: "${parameters.taskName}"`,
          );

          // Create a partial task object with the provided parameters
          const taskUpdate: Partial<Task> = {};
          if (parameters.title) taskUpdate.title = parameters.title;
          if (parameters.description)
            taskUpdate.description = parameters.description;
          if (parameters.dueDate) taskUpdate.dueDate = parameters.dueDate;
          if (parameters.dueTime) taskUpdate.dueTime = parameters.dueTime;
          if (parameters.priority)
            taskUpdate.priority = parameters.priority as any;
          if (parameters.category) taskUpdate.category = parameters.category;
          if (parameters.notify !== undefined)
            taskUpdate.notify = parameters.notify;

          console.log(
            'LexAI :: executeToolCall() :: Update data:',
            JSON.stringify(taskUpdate),
          );

          try {
            await this.taskService.updateTaskByName(
              parameters.taskName,
              taskUpdate,
            );
            console.log(
              `LexAI :: executeToolCall() :: Task "${parameters.taskName}" updated successfully`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskName: parameters.taskName,
                message: 'Task updated successfully.',
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error updating task: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to update task: ${error.message}`,
            };
          }

        case 'deleteTask':
          // Validate required parameter
          if (!parameters.taskName) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: taskName',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: taskName',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Deleting task: "${parameters.taskName}"`,
          );

          try {
            await this.taskService.deleteTaskByName(parameters.taskName);
            console.log(
              `LexAI :: executeToolCall() :: Task "${parameters.taskName}" deleted successfully`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskName: parameters.taskName,
                message: 'Task deleted successfully.',
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error deleting task: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to delete task: ${error.message}`,
            };
          }

        case 'toggleTaskCompletion':
          // Validate required parameter
          if (!parameters.taskName) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: taskName',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: taskName',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Toggling completion for task: "${parameters.taskName}"`,
          );

          try {
            await this.taskService.toggleTaskCompletionByName(
              parameters.taskName,
            );
            console.log(
              `LexAI :: executeToolCall() :: Completion toggled for task "${parameters.taskName}"`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskName: parameters.taskName,
                message: 'Task completion status toggled.',
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error toggling task completion: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to toggle task completion: ${error.message}`,
            };
          }

        case 'createRoom':
          // Validate required parameter
          if (!parameters.title) {
            return {
              ...toolCall,
              error: 'Missing required parameter: title',
            };
          }

          return {
            ...toolCall,
            response: {
              success: true,
              message: `Created room: ${parameters.title}`,
              // Navigate to the room (if you have this capability)
              roomInfo: {
                title: parameters.title,
                description: parameters.description || '',
                isPrivate:
                  parameters.isPrivate !== undefined
                    ? parameters.isPrivate
                    : false,
              },
            },
          };

        case 'webSearch':
          try {
            const webSearchQuery = parameters.query || 'learnex app';
            console.log('Executing web search for:', webSearchQuery);

            // Create a search result that points to a real search engine
            const searchResults: WebSearchResult[] = [
              {
                title: `Search results for "${webSearchQuery}"`,
                url: `https://www.google.com/search?q=${encodeURIComponent(
                  webSearchQuery,
                )}`,
                snippet:
                  'This search will open in your browser when you click the link in my response.',
              },
            ];

            return {
              ...toolCall,
              response: {
                query: webSearchQuery,
                results: searchResults,
                message: `I found search results for "${webSearchQuery}". You can see them in my response.`,
              },
            };
          } catch (error: any) {
            console.error('Web search error:', error);
            return {
              ...toolCall,
              error: `Failed to search the web: ${
                error.message || 'Unknown error'
              }`,
            };
          }

        case 'openUrl':
          // Validate required parameter
          if (!parameters.url) {
            return {
              ...toolCall,
              error: 'Missing required parameter: url',
            };
          }

          try {
            // Ensure URL has proper protocol
            let url = parameters.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }

            // Safety check for URLs
            if (!this.isUrlSafe(url)) {
              return {
                ...toolCall,
                error: 'URL appears to be unsafe or malicious.',
              };
            }

            // Handle differently based on mode
            if (this.mode === LexAIMode.AGENT) {
              // In agent mode, open the URL directly
              Linking.openURL(url);
              return {
                ...toolCall,
                response: {
                  success: true,
                  url,
                  opened: true,
                  message: `I've opened this URL for you: ${url}`,
                },
              };
            } else {
              // In simple chat mode, just return the URL to be displayed in the chat
              return {
                ...toolCall,
                response: {
                  success: true,
                  url,
                  willOpen: false,
                  displayInChat: true,
                  message: `Here's the link you requested: ${url}`,
                },
              };
            }
          } catch (error: any) {
            console.error('URL opening error:', error);
            return {
              ...toolCall,
              error: `Failed to process URL: ${
                error.message || 'Unknown error'
              }`,
            };
          }

        default:
          return {
            ...toolCall,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error: any) {
      console.error(`Error executing tool ${toolCall.toolName}:`, error);
      return {
        ...toolCall,
        error: `Error executing tool ${toolCall.toolName}: ${error.message}`,
      };
    }
  }

  /**
   * Process a tool result and get a follow-up response from the AI
   */
  private async processToolResult(
    toolResult: LexAIToolCall,
    conversation: LexAIConversation,
  ): Promise<LexAIResponse> {
    try {
      // Get messages for context (excluding system messages for API)
      const messages = conversation.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          parts: [{text: msg.content}],
        }));

      // Prepare request for API
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${
                  this.systemPrompt
                }\n\nHere's the conversation so far: ${JSON.stringify(
                  messages,
                )}\n\nI executed the tool ${
                  toolResult.toolName
                } with parameters ${JSON.stringify(
                  toolResult.parameters,
                )} and got this result: ${JSON.stringify(
                  toolResult.response || toolResult.error,
                )}. Please provide an appropriate response to the user based on this result.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      };

      // Make API request without streaming
      console.log('Sending tool result follow-up request to Gemini API');
      const response = await axios.post(
        `${this.API_URL}?key=${this.API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Received tool result follow-up response');
      console.log(
        'Response structure:',
        JSON.stringify(response.data, null, 2).substring(0, 500) + '...',
      );

      // Extract text content
      let textContent = '';
      if (response.data.candidates?.[0]?.content?.parts) {
        console.log('Processing tool result text parts');
        for (const part of response.data.candidates[0].content.parts) {
          if (part.text) {
            textContent += part.text;
          }
        }
        console.log(
          'Extracted tool result text content length:',
          textContent.length,
        );
      } else {
        console.log('No content parts found in tool result response');
      }

      // Provide a fallback message if no text is found
      if (!textContent.trim()) {
        console.log(
          'No text content found in tool result, using fallback message',
        );
        textContent =
          "I processed your request but couldn't generate a proper response. Here's what happened: " +
          (toolResult.error
            ? `There was an error: ${toolResult.error}`
            : `I completed the action successfully.`);
      }

      // Create a message from the response
      const aiMsg: LexAIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: textContent,
        timestamp: Date.now(),
      };

      return {
        message: aiMsg,
        toolCalls: [toolResult],
      };
    } catch (error: any) {
      console.error('Error in LexAI processToolResult:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error(
          'API response error:',
          JSON.stringify(error.response.data),
        );
      }

      // Return a fallback message
      const aiMsg: LexAIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `I tried to help with that, but encountered an issue. Could you try asking in a different way?`,
        timestamp: Date.now(),
      };

      return {
        message: aiMsg,
        toolCalls: [toolResult],
      };
    }
  }

  /**
   * Save a conversation to Firestore
   */
  public async saveConversation(
    conversation: LexAIConversation,
  ): Promise<void> {
    try {
      await LexAIFirestoreService.saveConversation(conversation);
    } catch (error) {
      console.error('Error saving LexAI conversation:', error);
      throw error;
    }
  }

  /**
   * Load conversations from Firestore
   */
  public async loadConversations(): Promise<LexAIConversation[]> {
    try {
      return await LexAIFirestoreService.loadConversations();
    } catch (error) {
      console.error('Error loading LexAI conversations:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    try {
      await LexAIFirestoreService.deleteConversation(conversationId);
    } catch (error) {
      console.error('Error deleting LexAI conversation:', error);
      throw error;
    }
  }

  // Enhanced URL safety check method
  private isUrlSafe(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // List of known malicious domains (would be more comprehensive in production)
      const unsafeDomains = [
        'evil.com',
        'malware.com',
        'phishing.com',
        'virus.com',
        'hack.com',
        'scam.com',
        'spam.com',
        'trojan.com',
      ];

      // Check against unsafe domains
      for (const unsafeDomain of unsafeDomains) {
        if (
          domain.includes(unsafeDomain) ||
          domain.endsWith(`.${unsafeDomain}`)
        ) {
          console.warn(`Blocked access to unsafe domain: ${domain}`);
          return false;
        }
      }

      // Check for suspicious TLDs that are often associated with malicious sites
      const suspiciousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.gq'];
      for (const tld of suspiciousTLDs) {
        if (domain.endsWith(tld)) {
          console.warn(`Blocked access to suspicious TLD: ${domain}`);
          return false;
        }
      }

      // Block certain protocols
      const blockedProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      for (const protocol of blockedProtocols) {
        if (url.toLowerCase().startsWith(protocol)) {
          console.warn(`Blocked dangerous protocol: ${protocol}`);
          return false;
        }
      }

      // Restrict to common protocols (http and https)
      if (!urlObj.protocol.match(/^https?:$/)) {
        console.warn(`Blocked uncommon protocol: ${urlObj.protocol}`);
        return false;
      }

      // Only allow http and https URLs
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        console.warn(
          `Only http: and https: protocols are allowed, blocked: ${urlObj.protocol}`,
        );
        return false;
      }

      // URL passed all safety checks
      return true;
    } catch (error) {
      // If URL parsing fails, consider it unsafe
      console.warn(`URL parsing failed for: ${url}`);
      return false;
    }
  }

  /**
   * Process the LexAI response and handle any actions that need to be taken
   * This is the method that should be called by the UI after getting a response
   */
  public async handleResponseActions(response: LexAIResponse): Promise<void> {
    try {
      // Check if there are any tool calls that require user-facing actions
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          // Handle only specific tools that need direct user interaction
          if (
            toolCall.toolName === 'openUrl' &&
            toolCall.response &&
            !toolCall.error
          ) {
            const urlResponse = toolCall.response as any;

            // Action depends on mode and response properties
            if (urlResponse.url) {
              if (this.mode === LexAIMode.AGENT && urlResponse.opened) {
                // In AGENT mode with opened flag, we've already opened the URL
                console.log(
                  'URL was opened directly in agent mode:',
                  urlResponse.url,
                );
              } else if (
                this.mode === LexAIMode.SIMPLE_CHAT &&
                urlResponse.displayInChat
              ) {
                // In SIMPLE_CHAT mode, URLs are displayed in chat for user to tap
                console.log(
                  'URL will be displayed in chat for user to tap:',
                  urlResponse.url,
                );
                // No need to do anything here, the UI will handle displaying the URL
              } else if (urlResponse.willOpen) {
                // Backward compatibility for older implementations
                await Linking.openURL(urlResponse.url);
                console.log('Opened URL (legacy mode):', urlResponse.url);
              }
            }
          }

          // Handle web search results if needed
          if (
            toolCall.toolName === 'webSearch' &&
            toolCall.response &&
            !toolCall.error
          ) {
            const searchResponse = toolCall.response as any;
            if (
              this.mode === LexAIMode.AGENT &&
              searchResponse.results &&
              searchResponse.results.length > 0
            ) {
              // In AGENT mode, we automatically open the first search result
              const searchUrl = searchResponse.results[0].url;
              if (searchUrl && this.isUrlSafe(searchUrl)) {
                await Linking.openURL(searchUrl);
                console.log('Opened search results:', searchUrl);
              }
            }
            // In SIMPLE_CHAT mode, search results are just shown in the conversation
          }
        }
      }
    } catch (error) {
      console.error('Error handling response actions:', error);
    }
  }

  /**
   * Check if the user message matches patterns that should force specific tool calls
   * @param userMessage The user's message
   * @returns A tool call object if pattern matched, null otherwise
   */
  private checkForForcedToolCalls(userMessage: string): LexAIToolCall | null {
    const lowerMessage = userMessage.toLowerCase().trim();
    console.log(
      `LexAI :: checkForForcedToolCalls() :: Checking message: "${lowerMessage}"`,
    );

    // Task deletion patterns with enhanced extraction
    if (
      lowerMessage.match(
        /^delete\s+(?:the\s+)?(?:task\s+)?(.+?)(?:\s+task)?$/i,
      ) ||
      lowerMessage.match(/^remove\s+(?:the\s+)?(?:task\s+)?(.+?)(?:\s+task)?$/i)
    ) {
      // Extract task name from message using simplified regex
      let taskName = '';

      // Unified regex that handles all deletion cases
      const deleteMatch = lowerMessage.match(
        /^(?:delete|remove)\s+(?:the\s+)?(?:task\s+)?(.+?)(?:\s+task)?$/i,
      );

      if (deleteMatch) {
        taskName = deleteMatch[1].trim();

        // Remove "the task" if it was captured in the task name
        if (taskName.startsWith('the task ')) {
          taskName = taskName.substring(9).trim();
        }

        // If the task name contains "the task" anywhere, fix it
        taskName = taskName.replace(/the\s+task\s+/gi, '').trim();
      }

      if (taskName) {
        console.log(
          `LexAI :: checkForForcedToolCalls() :: Detected delete task request for: "${taskName}"`,
        );
        return {
          id: generateUUID(),
          toolName: 'deleteTask',
          parameters: {taskName},
        };
      }
    }

    // Task completion toggle patterns
    if (
      lowerMessage.match(
        /^(mark|set)\s+task\s+(.+)\s+as\s+(complete|done|finished)$/i,
      ) ||
      lowerMessage.match(
        /^(mark|set)\s+(.+)\s+as\s+(complete|done|finished)$/i,
      ) ||
      lowerMessage.match(
        /^(mark|set)\s+(.+)\s+task\s+as\s+(complete|done|finished)$/i,
      ) ||
      lowerMessage.match(/^complete\s+task\s+(.+)$/i) ||
      lowerMessage.match(/^complete\s+(.+)$/i) ||
      lowerMessage.match(/^finish\s+task\s+(.+)$/i) ||
      lowerMessage.match(/^finish\s+(.+)$/i)
    ) {
      // Extract task name from message
      let taskName = '';

      const match1 = lowerMessage.match(
        /^(mark|set)\s+task\s+(.+)\s+as\s+(complete|done|finished)$/i,
      );
      const match2 = lowerMessage.match(
        /^(mark|set)\s+(.+)\s+as\s+(complete|done|finished)$/i,
      );
      const match3 = lowerMessage.match(
        /^(mark|set)\s+(.+)\s+task\s+as\s+(complete|done|finished)$/i,
      );
      const match4 = lowerMessage.match(/^complete\s+task\s+(.+)$/i);
      const match5 = lowerMessage.match(/^complete\s+(.+)$/i);
      const match6 = lowerMessage.match(/^finish\s+task\s+(.+)$/i);
      const match7 = lowerMessage.match(/^finish\s+(.+)$/i);

      if (match1) taskName = match1[2].trim();
      else if (match2) taskName = match2[2].trim();
      else if (match3) taskName = match3[2].trim();
      else if (match4) taskName = match4[1].trim();
      else if (match5) taskName = match5[1].trim();
      else if (match6) taskName = match6[1].trim();
      else if (match7) taskName = match7[1].trim();

      if (taskName) {
        console.log(
          `LexAI :: checkForForcedToolCalls() :: Detected complete task request for: "${taskName}"`,
        );
        return {
          id: generateUUID(),
          toolName: 'toggleTaskCompletion',
          parameters: {taskName},
        };
      }
    }

    // Web search patterns
    if (
      lowerMessage.includes('search') ||
      lowerMessage.includes('look up') ||
      lowerMessage.includes('find') ||
      lowerMessage.match(
        /what is|who is|when is|where is|how to|can you tell me about/,
      )
    ) {
      // Extract search query - remove action words
      let query = userMessage
        .replace(
          /^(search|look up|find|search for|look for|find out about)/i,
          '',
        )
        .trim();

      // If empty after removing action words, use the whole message
      if (!query) query = userMessage;

      console.log(
        `LexAI :: checkForForcedToolCalls() :: Detected web search request for: "${query}"`,
      );
      return {
        id: generateUUID(),
        toolName: 'webSearch',
        parameters: {query},
      };
    }

    // In SIMPLE_CHAT mode, only allow web search and open URL patterns
    if (this.mode === LexAIMode.SIMPLE_CHAT) {
      // Log navigation attempts in SIMPLE_CHAT mode
      if (
        lowerMessage.includes('navigate to') ||
        lowerMessage.includes('go to') ||
        lowerMessage.includes('open screen') ||
        lowerMessage.match(/^navigate|^go to|^open/)
      ) {
        console.log(
          'Navigation request detected in SIMPLE_CHAT mode. Ignoring forced tool call.',
        );
      }

      // Open URL patterns (allowed in SIMPLE_CHAT mode)
      if (
        lowerMessage.includes('open url') ||
        lowerMessage.includes('visit website') ||
        lowerMessage.includes('open website') ||
        lowerMessage.includes('go to website') ||
        lowerMessage.includes('.com') ||
        lowerMessage.includes('.org') ||
        lowerMessage.includes('.net') ||
        lowerMessage.includes('http')
      ) {
        // Try to extract URL
        let url = '';

        // Look for URL patterns
        const urlMatches = userMessage.match(
          /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/i,
        );
        if (urlMatches) {
          // Use the first match group that has a value
          for (let i = 1; i < urlMatches.length; i++) {
            if (urlMatches[i]) {
              url = urlMatches[i];
              break;
            }
          }
        }

        if (url) {
          console.log(
            `LexAI :: checkForForcedToolCalls() :: Detected URL open request for: "${url}"`,
          );
          return {
            id: generateUUID(),
            toolName: 'openUrl',
            parameters: {url},
          };
        }
      }

      // In SIMPLE_CHAT mode, return here without checking for other tool patterns
      return null;
    }

    // The following tool patterns are for AGENT mode only

    // Add task patterns
    if (
      lowerMessage.includes('add task') ||
      lowerMessage.includes('create task') ||
      lowerMessage.includes('add a task') ||
      lowerMessage.includes('create a task') ||
      lowerMessage.includes('remind me') ||
      lowerMessage.includes('set reminder')
    ) {
      // Try to extract task title
      let title = 'New Task';

      // Look for patterns like "add task X" or "add a task called X"
      const titleMatches = userMessage.match(
        /(add|create)(?:\sa)?\stask(?:\scalled|\snamed|\stitled)?\s+(.*?)(?:$|for|on|at)/i,
      );
      if (titleMatches && titleMatches[2]) {
        title = titleMatches[2].trim();
      } else if (lowerMessage.includes('remind me')) {
        // Extract what comes after "remind me to" or "remind me"
        const reminderMatches = userMessage.match(
          /remind me(?:\sto)?\s+(.*?)(?:$|on|at)/i,
        );
        if (reminderMatches && reminderMatches[1]) {
          title = reminderMatches[1].trim();
        }
      }

      // Get current date + 1 day for default due date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(
        `LexAI :: checkForForcedToolCalls() :: Detected add task request for: "${title}"`,
      );
      return {
        id: generateUUID(),
        toolName: 'addTask',
        parameters: {
          title,
          dueDate,
          dueTime: '12:00',
          priority: 'medium',
          category: 'general',
          notify: true,
        },
      };
    }

    // Navigate patterns
    if (
      lowerMessage.includes('navigate to') ||
      lowerMessage.includes('go to') ||
      lowerMessage.includes('open screen') ||
      lowerMessage.match(/^navigate|^go to|^open/)
    ) {
      // Try to extract screen name
      let screenName = 'Home';

      // Look for patterns like "navigate to X" or "go to X screen"
      const screenMatches = userMessage.match(
        /(navigate to|go to|open)(?:\sthe)?\s+([a-z0-9\s]+?)(?:\sscreen|\spage)?(?:$|\s)/i,
      );
      if (screenMatches && screenMatches[2]) {
        screenName = screenMatches[2].trim();
      }

      console.log(
        `LexAI :: checkForForcedToolCalls() :: Detected navigation request to: "${screenName}"`,
      );
      return {
        id: generateUUID(),
        toolName: 'navigate',
        parameters: {screenName},
      };
    }

    // Open URL patterns
    if (
      lowerMessage.includes('open url') ||
      lowerMessage.includes('visit website') ||
      lowerMessage.includes('open website') ||
      lowerMessage.includes('go to website') ||
      lowerMessage.includes('.com') ||
      lowerMessage.includes('.org') ||
      lowerMessage.includes('.net') ||
      lowerMessage.includes('http')
    ) {
      // Try to extract URL
      let url = '';

      // Look for URL patterns
      const urlMatches = userMessage.match(
        /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/i,
      );
      if (urlMatches) {
        // Use the first match group that has a value
        for (let i = 1; i < urlMatches.length; i++) {
          if (urlMatches[i]) {
            url = urlMatches[i];
            break;
          }
        }
      }

      if (url) {
        console.log(
          `LexAI :: checkForForcedToolCalls() :: Detected URL open request for: "${url}"`,
        );
        return {
          id: generateUUID(),
          toolName: 'openUrl',
          parameters: {url},
        };
      }
    }

    console.log(
      `LexAI :: checkForForcedToolCalls() :: No forced tool calls detected for message: "${lowerMessage}"`,
    );
    return null;
  }

  /**
   * Generate message suggestions for direct messaging based on conversation history
   * @param conversationHistory Previous messages in the conversation
   * @param recipientName Name of the person the user is chatting with
   * @returns Array of suggested messages
   */
  public async generateMessageSuggestions(
    conversationHistory: Message[],
    recipientName: string,
  ): Promise<string[]> {
    try {
      // Default suggestions in case API fails
      const defaultSuggestions = [
        `How are you doing, ${recipientName}?`,
        'Would you like to meet up later?',
        'That sounds interesting!',
      ];

      // If there are no messages yet, return initial greeting suggestions
      if (conversationHistory.length === 0) {
        return [
          `Hi ${recipientName}!`,
          `Hello ${recipientName}, how are you?`,
          `Hey ${recipientName}, nice to connect!`,
        ];
      }

      // Limit history to last 6 messages to keep context relevant and reduce token usage
      const recentMessages = conversationHistory.slice(-6);

      // Format conversation for the API
      const formattedConversation = recentMessages.map(msg => ({
        role: 'user', // All messages are treated as user context
        parts: [
          {
            text: `${
              msg.senderId === auth().currentUser?.uid ? 'Me' : recipientName
            }: ${msg.text}`,
          },
        ],
      }));

      // Prepare request payload
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Given this conversation with ${recipientName}, suggest 3 short, natural-sounding replies I could send next. Format as a JSON array of strings, and keep suggestions brief (under 10 words when possible). Don't include descriptions, just the message text in conversational language:
                ${JSON.stringify(formattedConversation)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      };

      // Make the API request
      console.log('Requesting message suggestions from API');
      const response = await axios.post(
        `${this.API_URL}?key=${this.API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Extract suggestions from response
      let suggestions: string[] = defaultSuggestions;

      try {
        if (response.data.candidates && response.data.candidates.length > 0) {
          const content = response.data.candidates[0].content;
          if (content && content.parts && content.parts.length > 0) {
            const responseText = content.parts[0].text;

            // Try to parse the JSON array
            if (responseText) {
              // Look for array pattern
              const match = responseText.match(/\[.*\]/s);
              if (match) {
                const jsonArray = match[0];
                const parsedSuggestions = JSON.parse(jsonArray);
                if (
                  Array.isArray(parsedSuggestions) &&
                  parsedSuggestions.length > 0
                ) {
                  suggestions = parsedSuggestions.slice(0, 3); // Limit to 3 suggestions
                }
              }
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing suggestions response:', parseError);
        // Use defaults if parsing fails
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating message suggestions:', error);
      return [
        `How are you doing, ${recipientName}?`,
        'Would you like to meet up later?',
        'Sounds good!',
      ];
    }
  }

  /**
   * Check if a message is confirming a previous task deletion request
   * @param userMessage The user's message
   * @param conversation The current conversation
   * @returns Object with taskName if this is a confirmation, null otherwise
   */
  private isConfirmationMessage(
    userMessage: string,
    conversation: LexAIConversation,
  ): {taskName: string} | null {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Common confirmation patterns
    const isConfirmation =
      lowerMessage === 'yes' ||
      lowerMessage === 'yeah' ||
      lowerMessage === 'yep' ||
      lowerMessage === 'sure' ||
      lowerMessage === 'ok' ||
      lowerMessage === 'okay' ||
      lowerMessage === 'confirm' ||
      lowerMessage === 'do it' ||
      lowerMessage.includes('go ahead');

    if (!isConfirmation) return null;

    // Check the previous assistant message for task deletion question
    if (conversation.messages.length >= 2) {
      const lastAssistantMessageIndex = conversation.messages
        .slice(0, -1) // Exclude the current user message
        .reverse()
        .findIndex(msg => msg.role === 'assistant');

      if (lastAssistantMessageIndex !== -1) {
        const lastAssistantMessage =
          conversation.messages[
            conversation.messages.length - 2 - lastAssistantMessageIndex
          ];
        const content = lastAssistantMessage.content.toLowerCase();

        // Look for patterns like "delete the task named X" or "Did you mean to delete X"
        const taskNameMatch =
          content.match(
            /delete(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          content.match(/\bdelete\s+["']?([^"'?.,]+)["']?/i) ||
          content.match(
            /remove(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          );

        if (taskNameMatch && taskNameMatch[1]) {
          return {taskName: taskNameMatch[1].trim()};
        }
      }
    }

    return null;
  }

  /**
   * Handle a confirmed action like task deletion
   * @param toolCall The tool call to execute
   * @param conversation The current conversation
   * @returns LexAIResponse with the result
   */
  private async handleConfirmedAction(
    toolCall: LexAIToolCall,
    conversation: LexAIConversation,
  ): Promise<LexAIResponse> {
    try {
      console.log(
        `LexAI :: handleConfirmedAction() :: Executing confirmed action: ${toolCall.toolName}`,
        JSON.stringify(toolCall.parameters),
      );

      // Execute the tool call
      const toolResult = await this.executeToolCall(toolCall);

      // Process the result with another API call
      const followUpResponse = await this.processToolResult(
        toolResult,
        conversation,
      );

      return followUpResponse;
    } catch (error: any) {
      console.error('Error handling confirmed action:', error);

      // Return a fallback message
      const aiMsg: LexAIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `I tried to process your confirmation, but encountered an issue: ${error.message}`,
        timestamp: Date.now(),
      };

      return {
        message: aiMsg,
        toolCalls: [toolCall],
      };
    }
  }
}

// Create and export a single instance of the service
export default new LexAIService();
