import axios from 'axios';
import Config from 'react-native-config';
import {Linking} from 'react-native';
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
import firestore from '@react-native-firebase/firestore';
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
          'Navigate to a specific screen in the application. Use this function call when a user asks to navigate, go to a screen, or open a section of the app. Valid screen names are: "Home", "Search", "CreatePost" (these are in the Tab Navigator), "Tasks", "Room","EventsAndHackathons", "Conversations", "ContactList", "SavedPosts", "QRCode". For "Home", "Search", and "CreatePost" screens, they need special navigation via "Tabs" navigator.',
        parameters: {
          screenName: 'string - The name of the screen to navigate to',
          params: 'object - Optional parameters to pass to the screen',
        },
      },
      {
        name: 'searchPosts',
        description:
          'Search for posts using a keyword or phrase. Use this function call when user wants to find posts or content within the app.',
        parameters: {
          query: 'string - The search term to look for in posts',
        },
      },
      {
        name: 'getTasks',
        description:
          'Get all tasks for the current user. Use this function call when the user asks to see their tasks, to-dos, or reminders. If the user specifically asks for team tasks, use getTeamTasks instead.',
        parameters: {},
      },
      {
        name: 'getTeamTasks',
        description:
          'Get all team/duo tasks for the current user. Use this function call when the user asks about their team tasks, collaborative tasks, or shared to-dos specifically. This returns tasks that are shared with collaborators.',
        parameters: {},
      },
      {
        name: 'addTask',
        description:
          "Add a new task to the user's task list. Use this function call IMMEDIATELY when a user mentions adding a task, creating a reminder, setting up a to-do, or using phrases like 'remind me', even if only the title is provided. Default values will be used for missing parameters. If you detect any intent to create a task, use this function call right away without asking for confirmation.",
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
        name: 'addTeamTask',
        description:
          "Add a new team task that will be shared with collaborators. Use this function call IMMEDIATELY when a user mentions adding a team task, collaborative task, shared to-do, or phrases like 'create a task for our team'. The system will handle finding and adding the collaborator. Default values will be used for missing parameters.",
        parameters: {
          title: 'string - The title of the team task',
          description: 'string - Optional description of the team task',
          collaboratorEmail:
            'string - Email of the collaborator to add to this task',
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
          'Update an existing task. Use this function call IMMEDIATELY when user wants to modify, change, update, edit, or alter a task. Extract the task name from their request and pass it as the taskName parameter, along with any fields they want to change. DO NOT ask for confirmation first - make your best guess about which task they want to modify and call this function right away. For example, if user says "make it due tomorrow" after discussing a task, call this function with that task name and the updated due date.',
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
          'Delete a task by its name. Use this function call IMMEDIATELY when the user asks to delete, remove, clear, get rid of, cancel, or eliminate a task. Extract the task name from their request and pass it as the taskName parameter. Do not ask for confirmation first - call this function right away with your best guess of the task name. If the task name is ambiguous or not found, the function will return an error, and you can then ask for clarification.',
        parameters: {
          taskName:
            'string - The exact name of the task to delete (not the ID). Must match exactly with an existing task name.',
        },
      },
      {
        name: 'toggleTaskCompletion',
        description:
          'Mark a task as complete or incomplete. Use this function call IMMEDIATELY when user mentions completing a task, marking it as done/finished, checking it off, or they want to mark it as incomplete, undone, or reopen it. Extract the task name from their request and pass it as the taskName parameter. Do not ask for confirmation first - call this function right away with your best guess of the task name.',
        parameters: {
          taskName: 'string - The name of the task to toggle completion status',
        },
      },
      {
        name: 'acceptTeamTaskInvitation',
        description:
          'Accept an invitation to join a team task. Use this function call when the user wants to accept, approve, or join a team task they were invited to. The taskId is required and can be obtained from the list of pending invitations returned by getTeamTasks.',
        parameters: {
          taskId: 'string - The ID of the team task invitation to accept',
        },
      },
      {
        name: 'rejectTeamTaskInvitation',
        description:
          'Reject an invitation to join a team task. Use this function call when the user wants to decline, reject, or refuse a team task invitation. The taskId is required and can be obtained from the list of pending invitations returned by getTeamTasks.',
        parameters: {
          taskId: 'string - The ID of the team task invitation to reject',
        },
      },
      {
        name: 'createRoom',
        description:
          'Create a new meeting room with a specific title. Use this function call when user wants to create, set up, or make a meeting room. You can optionally link a team task (from getTeamTasks) by including its taskId.',
        parameters: {
          title: 'string - The title for the meeting room',
          description: 'string - Optional description for the meeting',
          isPrivate:
            'boolean - Whether the meeting is private (default: false)',
          taskId:
            'string - Optional ID of a team task to associate with this meeting',
        },
      },
      {
        name: 'joinRoom',
        description:
          'Join an existing meeting room using a room code. Use this function call when user wants to join, enter, or access a meeting room with a specific code.',
        parameters: {
          roomCode: 'string - The code for the meeting room to join',
        },
      },
      {
        name: 'webSearch',
        description:
          'Search the web for information not available in the knowledge base. Use this function call when user asks to search, look up, or find information online. Extract search terms from the user query.',
        parameters: {
          query: 'string - The search query to look up on the web',
        },
      },
      {
        name: 'openUrl',
        description:
          'Open a URL in the browser. Use this function call when a user mentions opening a website, visiting a URL, or browsing to a specific site.',
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
You have access to several capabilities to help the user via function calls:

1. You can help users navigate through the app with the "navigate" tool
2. You can search for posts in the app with the "searchPosts" tool
3. You can manage tasks using these tools:
   - "getTasks" - Use this when users ask about their tasks
   - "addTask" - Use this when users want to create a new personal task or reminder
   - "addTeamTask" - Use this when users want to create a shared task with collaborators
   - "updateTask" - Use this when users mention changing any task details
   - "deleteTask" - Use this when users want to remove a task
   - "toggleTaskCompletion" - Use this when users want to mark a task as done
   
   CRITICAL FUNCTION CALL RULES:
   - You MUST RESPOND WITH FUNCTION CALLS for ANY task operations (add, delete, update, complete, list) - NO EXCEPTIONS.
   - IF the user says anything about deleting a task, you MUST CALL deleteTask function immediately.
   - IF the user says anything about updating a task, you MUST CALL updateTask function immediately.
   - NEVER say you've done something (like updating a task) in text unless you've actually made the function call.
   - NEVER ask for confirmation before calling functions - just make the function call directly.
   - If you need clarification about which task to modify, use the function call with your best guess and handle errors.
   - ALWAYS use the task NAME (not ID) for all task operations
   - Use "deleteTask" with the parameter taskName: "Buy groceries" (not taskId)
   - Task names must be unique - you cannot create two tasks with the same name
   - If a user tries to create a task with a name that already exists, suggest using a more specific name
   - If a task name is ambiguous or not found, ask the user for clarification
   - When detecting indirect references to tasks like "delete it" or "the previous one", extract the task name from context
   - Always use the appropriate task function call when the intent relates to task management, never just talk about doing it
   - Use "addTeamTask" when users want to create a shared task with someone else (requires collaborator email)
   - Team tasks require a collaborator email address for sharing - if not provided, ask the user who they want to share with
   - Team task management includes:
     * Use "getTeamTasks" to view all team tasks including pending invitations
     * Use "acceptTeamTaskInvitation" to accept a team task invitation (requires taskId)
     * Use "rejectTeamTaskInvitation" to decline a team task invitation (requires taskId)

4. You can manage meeting rooms:
   - "createRoom" - Use this when users want to create a new meeting room
   - "joinRoom" - Use this when users want to join an existing meeting with a room code
   - Note: When creating a meeting room, you can associate it with a team task (not regular tasks)
   - Team tasks can be fetched using "getTeamTasks" function call
   - ONLY team tasks (not regular tasks) can be linked with meeting rooms
   - When a user wants to create a meeting room for collaboration with others:
     * First check if they have a team task using "getTeamTasks"
     * If not, suggest creating a team task first with "addTeamTask"
     * Then create a meeting room and link it to the team task ID

5. You can perform web searches using the "webSearch" tool
6. You can open URLs using the "openUrl" tool
7. You can help users understand how to use the app

YOU ARE REQUIRED TO USE FUNCTION CALLS FOR ALL ACTIONS. The system ONLY supports function calls from the model.
You CANNOT perform actions through text responses. EVERY action MUST be a function call.

CRITICAL: ALL of these phrases require IMMEDIATE function calls, not text responses:
- "Delete it" → MUST call deleteTask with taskName based on context
- "Update task2 due date to April 21, 2025" → MUST call updateTask with taskName: "task2" and dueDate: "2025-04-21"
- "Previous one" → MUST determine the task from context and use appropriate function
- "Yes" (after asking about a task) → MUST make the function call right away
- "Join meeting ABC123" → MUST call joinRoom with roomCode: "ABC123"

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

Remember:
- ALWAYS USE FUNCTION CALLS for task operations - never use text to pretend you did them
- Never say "I'll delete that for you" - CALL the deleteTask function instead
- Never ask "which task do you want to delete" - make your best guess from context and call the function
- Be concise in text responses
- When working with tasks, always use the task NAME (not ID) for all operations
- ALWAYS use function calls for any action that requires app functionality
`;
    } else {
      // Simple chat mode instructions
      basePrompt += `
You are in simple chat mode, focused on being a helpful conversational assistant.

In this mode:
1. You can engage in general discussion and answer factual questions using your built-in knowledge
2. You can provide educational content, explanations, and information based on your training
3. You cannot directly manipulate the app (no task creation, navigation, etc.)
4. You do not have web search capabilities or the ability to access external information

When asked about topics:
- Draw on your built-in knowledge to provide accurate, helpful information
- If you're unsure about something, admit the limitations of your knowledge 
- Never claim to search the web or access external information
- When asked about topics outside your knowledge, explain that you can only provide information based on your training
- Do not suggest that you could perform a search or that the user switch to Agent mode

Focus on being a good conversational partner. Be friendly, informative, and concise.
Your primary goal is to provide helpful information and engage in meaningful conversation.
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

      // First message of the conversation should include the system prompt
      const firstMessage = {
        role: 'user',
        parts: [{text: this.systemPrompt}],
      };

      // Prepare request for API with proper format for function calling
      const payload: any = {
        contents: [firstMessage, ...messages],
        generationConfig: {
          temperature: 0.0, // Set to absolute zero for deterministic behavior
          topK: 1,
          topP: 0.1,
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

      // Set temperature for more reliable function calls
      if (!payload.generationConfig) {
        payload.generationConfig = {};
      }

      // Set extremely low temperature for more deterministic function calls
      payload.generationConfig.temperature = 0.0;
      payload.generationConfig.topP = 0.1;
      payload.generationConfig.topK = 1;

      // Update system prompt in first message to enhance function calling behavior
      if (payload.contents && payload.contents.length > 0) {
        const firstMessage = payload.contents[0];
        if (
          firstMessage.role === 'user' &&
          firstMessage.parts &&
          firstMessage.parts.length > 0
        ) {
          // Add clear function call instructions to the system prompt
          const functionCallInstructions = `
IMPORTANT FUNCTION CALL INSTRUCTIONS:
1. You MUST use function calls for ALL actions - NEVER try to perform actions through text responses.
2. For ANY task-related operations (creating, updating, listing, deleting tasks), you MUST use function calls.
3. When users ask to delete something, IMMEDIATELY call the deleteTask function.
4. When users ask to update something, IMMEDIATELY call the updateTask function.
5. When users ask to create something, IMMEDIATELY call the addTask function.
6. NEVER reply with text when a function call is appropriate - the system can ONLY perform actions via function calls.
7. When users ask to search or look up information, IMMEDIATELY call the webSearch function.
8. User confirmations like "yes", "do it", or "go ahead" should trigger immediate function calls based on context.
9. NEVER say you'll do something without making the corresponding function call.

EXAMPLES OF CORRECT RESPONSES:
1. User: "Delete my homework task" → Call deleteTask with taskName="homework"
2. User: "Can you update the meeting task to be due tomorrow?" → Call updateTask with taskName="meeting"
3. User: "Create a task to buy groceries" → Call addTask with title="Buy groceries"
4. User: "What tasks do I have?" → Call getTasks
5. User: "Show me the latest React updates" → Call webSearch with query="latest React updates"
`;

          // Append to existing system prompt
          const currentText = firstMessage.parts[0].text;
          firstMessage.parts[0].text = currentText + functionCallInstructions;

          console.log('Enhanced system prompt with function call instructions');
        }
      }
    } else {
      // In simple chat mode, don't include any tools
      // This ensures the model will rely on its built-in knowledge

      // Set a moderate temperature for more natural conversation
      if (!payload.generationConfig) {
        payload.generationConfig = {};
      }
      payload.generationConfig.temperature = 0.7; // More natural conversation
      payload.generationConfig.topP = 0.95;
      payload.generationConfig.topK = 40;

      // Update system prompt for simple chat mode
      if (payload.contents && payload.contents.length > 0) {
        const firstMessage = payload.contents[0];
        if (
          firstMessage.role === 'user' &&
          firstMessage.parts &&
          firstMessage.parts.length > 0
        ) {
          // Add reminders about using internal knowledge
          const simpleModeInstructions = `
IMPORTANT INSTRUCTIONS:
1. You are in simple chat mode with no external tools.
2. Answer questions using your built-in knowledge only.
3. Do not claim to search for information or access external data.
4. When uncertain, admit the limitations of your knowledge rather than suggesting a search.
5. Focus on providing educational, informative content based on what you already know.
6. Be conversational, friendly, and concise in your responses.
`;

          // Append to existing system prompt
          const currentText = firstMessage.parts[0].text;
          firstMessage.parts[0].text = currentText + simpleModeInstructions;

          console.log(
            'Enhanced system prompt with instructions for simple chat mode',
          );
        }
      }
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

      // In simple chat mode, don't allow any tool calls including web search
      if (this.mode === LexAIMode.SIMPLE_CHAT) {
        return {
          ...toolCall,
          error: `Tool ${toolName} is not available in simple chat mode. Simple chat mode doesn't support any external tools.`,
        };
      }

      switch (toolName) {
        case 'navigate':
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
          console.log('LexAI :: executeToolCall() :: Getting user tasks');
          try {
            const tasks = await this.taskService.getTasks();
            console.log(
              `LexAI :: executeToolCall() :: Retrieved ${tasks.length} tasks`,
            );
            return {
              ...toolCall,
              response: {tasks},
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error getting tasks: ${error.message}`,
            );
            return {
              ...toolCall,
              error: 'Failed to retrieve tasks: ' + error.message,
            };
          }

        case 'getTeamTasks':
          console.log('LexAI :: executeToolCall() :: Getting user team tasks');
          try {
            const duoTasks = await this.taskService.getDuoTasks();
            console.log(
              `LexAI :: executeToolCall() :: Retrieved ${duoTasks.length} team tasks`,
            );

            // Get pending invitations as well
            const pendingInvitations =
              await this.taskService.getPendingDuoTaskInvitations();
            console.log(
              `LexAI :: executeToolCall() :: Retrieved ${pendingInvitations.length} pending team task invitations`,
            );

            return {
              ...toolCall,
              response: {
                teamTasks: duoTasks,
                pendingInvitations: pendingInvitations,
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error getting team tasks: ${error.message}`,
            );
            return {
              ...toolCall,
              error: 'Failed to retrieve team tasks: ' + error.message,
            };
          }

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
              isDuoTask: false, // Explicitly mark as a regular task, not a team task
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

            // Check if error is due to duplicate task name
            if (error.message && error.message.includes('already exists')) {
              // Extract the task name from the error message
              const taskNameMatch = error.message.match(/name "([^"]+)"/);
              if (taskNameMatch && taskNameMatch[1]) {
                const taskName = taskNameMatch[1];
                // Suggest adding a number suffix to make it unique
                return {
                  ...toolCall,
                  error: `A task named "${taskName}" already exists. Please try again with a different name, such as "${taskName} 2".`,
                };
              }
            }

            return {
              ...toolCall,
              error: `Failed to create task: ${error.message}`,
            };
          }

        case 'addTeamTask':
          // Validate required parameters
          if (!parameters.title) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: title',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: title',
            };
          }

          if (!parameters.collaboratorEmail) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: collaboratorEmail',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: collaboratorEmail',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Creating team task with title: "${parameters.title}" for collaborator: ${parameters.collaboratorEmail}`,
          );

          // Smart defaults for task creation
          const teamTaskNow = new Date();
          const teamTaskOneHourLater = new Date(
            teamTaskNow.getTime() + 60 * 60 * 1000,
          );

          // Format date and time for default values
          const teamTaskDefaultDueDate = teamTaskOneHourLater
            .toISOString()
            .split('T')[0]; // YYYY-MM-DD
          const teamTaskDefaultDueTime = `${teamTaskOneHourLater
            .getHours()
            .toString()
            .padStart(2, '0')}:${teamTaskOneHourLater
            .getMinutes()
            .toString()
            .padStart(2, '0')}`; // HH:MM

          try {
            console.log(
              'LexAI :: executeToolCall() :: Preparing team task data with defaults',
            );

            // First, get the current user ID
            const currentUserId = auth().currentUser?.uid;
            if (!currentUserId) {
              return {
                ...toolCall,
                error: 'User not authenticated',
              };
            }

            // Search for collaborator by email
            const userSnapshot = await firestore()
              .collection('users')
              .where('email', '==', parameters.collaboratorEmail)
              .limit(1)
              .get();

            if (userSnapshot.empty) {
              return {
                ...toolCall,
                error: `No user found with email ${parameters.collaboratorEmail}`,
              };
            }

            const collaboratorId = userSnapshot.docs[0].id;
            const collaboratorData = userSnapshot.docs[0].data();

            // Verify not adding self
            if (collaboratorId === currentUserId) {
              return {
                ...toolCall,
                error: 'You cannot add yourself as a collaborator',
              };
            }

            // Create task data with collaborators array
            const teamTaskData = {
              title: parameters.title,
              description: parameters.description || '',
              dueDate: parameters.dueDate || teamTaskDefaultDueDate,
              dueTime: parameters.dueTime || teamTaskDefaultDueTime,
              priority: parameters.priority || 'medium',
              category: parameters.category || 'general',
              notify:
                parameters.notify !== undefined ? parameters.notify : true,
              completed: false,
              userId: currentUserId,
              isDuoTask: true,
              collaborators: [currentUserId, collaboratorId],
              collaborationStatus: 'pending',
              progress: 0,
            };

            console.log(
              'LexAI :: executeToolCall() :: Team task data:',
              JSON.stringify(teamTaskData),
            );

            // Use the createDuoTask method to add the team task
            const teamTaskId = await this.taskService.createDuoTask(
              teamTaskData,
            );
            console.log(
              `LexAI :: executeToolCall() :: Team task created successfully with ID: ${teamTaskId}`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskId: teamTaskId,
                message: `Team task "${
                  parameters.title
                }" created and shared with ${
                  collaboratorData.displayName || parameters.collaboratorEmail
                }${
                  parameters.dueDate
                    ? ` for ${parameters.dueDate}`
                    : ' for today'
                }.`,
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error creating team task: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to create team task: ${error.message}`,
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

        case 'acceptTeamTaskInvitation':
          // Validate required parameter
          if (!parameters.taskId) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: taskId',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: taskId',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Accepting team task invitation: "${parameters.taskId}"`,
          );

          try {
            await this.taskService.acceptDuoTaskInvitation(parameters.taskId);
            console.log(
              `LexAI :: executeToolCall() :: Team task invitation accepted successfully`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskId: parameters.taskId,
                message: 'Team task invitation accepted successfully.',
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error accepting team task invitation: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to accept team task invitation: ${error.message}`,
            };
          }

        case 'rejectTeamTaskInvitation':
          // Validate required parameter
          if (!parameters.taskId) {
            console.log(
              'LexAI :: executeToolCall() :: Missing required parameter: taskId',
            );
            return {
              ...toolCall,
              error: 'Missing required parameter: taskId',
            };
          }

          console.log(
            `LexAI :: executeToolCall() :: Rejecting team task invitation: "${parameters.taskId}"`,
          );

          try {
            await this.taskService.rejectDuoTaskInvitation(parameters.taskId);
            console.log(
              `LexAI :: executeToolCall() :: Team task invitation rejected successfully`,
            );

            return {
              ...toolCall,
              response: {
                success: true,
                taskId: parameters.taskId,
                message: 'Team task invitation rejected successfully.',
              },
            };
          } catch (error: any) {
            console.log(
              `LexAI :: executeToolCall() :: Error rejecting team task invitation: ${error.message}`,
            );
            return {
              ...toolCall,
              error: `Failed to reject team task invitation: ${error.message}`,
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

        case 'joinRoom':
          // Validate required parameter
          if (!parameters.roomCode) {
            return {
              ...toolCall,
              error: 'Missing required parameter: roomCode',
            };
          }

          return {
            ...toolCall,
            response: {
              success: true,
              message: `Joined room: ${parameters.roomCode}`,
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
          temperature: 0.1, // Lower temperature for more deterministic responses
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

    // Skip forced tool call detection in SIMPLE_CHAT mode
    if (this.mode === LexAIMode.SIMPLE_CHAT) {
      console.log('In SIMPLE_CHAT mode: tool call detection disabled');
      return null;
    }

    console.log(
      `LexAI :: checkForForcedToolCalls() :: Checking for forced tool calls in: "${lowerMessage}"`,
    );

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
          isDuoTask: false, // Explicitly mark as a regular task, not a team task
        },
      };
    }

    // Add team task patterns
    if (
      lowerMessage.includes('add team task') ||
      lowerMessage.includes('create team task') ||
      lowerMessage.includes('add a team task') ||
      lowerMessage.includes('create a team task') ||
      lowerMessage.includes('add duo task') ||
      lowerMessage.includes('create duo task') ||
      lowerMessage.includes('add a duo task') ||
      lowerMessage.includes('create a duo task') ||
      lowerMessage.includes('add a task with') ||
      lowerMessage.includes('create a task with') ||
      lowerMessage.includes('create a shared task') ||
      lowerMessage.includes('add a shared task')
    ) {
      // Try to extract task title
      let title = 'New Team Task';
      let collaboratorEmail = '';

      // Look for patterns like "add team task X" or "add a team task called X"
      const titleMatches = userMessage.match(
        /(add|create)(?:\sa)?(?:\steam|\sduo|\sshared)?\stask(?:\scalled|\snamed|\stitled)?\s+(.*?)(?:$|for|on|at|with)/i,
      );
      if (titleMatches && titleMatches[2]) {
        title = titleMatches[2].trim();
      }

      // Try to extract collaborator email
      const emailMatches = userMessage.match(
        /with\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      );
      if (emailMatches && emailMatches[1]) {
        collaboratorEmail = emailMatches[1].trim();
      }

      // If no collaborator email is found, we'll return early since it's required
      if (!collaboratorEmail) {
        return null; // Let the AI handle this case with a proper response
      }

      // Get current date + 1 day for default due date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(
        `LexAI :: checkForForcedToolCalls() :: Detected add team task request for: "${title}" with collaborator: ${collaboratorEmail}`,
      );
      return {
        id: generateUUID(),
        toolName: 'addTeamTask',
        parameters: {
          title,
          collaboratorEmail,
          dueDate,
          dueTime: '12:00',
          priority: 'medium',
          category: 'general',
          notify: true,
        },
      };
    }

    // Accept team task invitation pattern
    if (
      (lowerMessage.includes('accept') ||
        lowerMessage.includes('approve') ||
        lowerMessage.includes('join') ||
        lowerMessage.includes('confirm')) &&
      (lowerMessage.includes('team task') ||
        lowerMessage.includes('duo task') ||
        lowerMessage.includes('team invitation') ||
        lowerMessage.includes('task invitation'))
    ) {
      // Try to extract task ID
      const taskIdMatches = userMessage.match(
        /task(?:\s+id)?(?:\s*:?\s*)([a-zA-Z0-9]+)/i,
      );
      let taskId = '';

      if (taskIdMatches && taskIdMatches[1]) {
        taskId = taskIdMatches[1].trim();

        console.log(
          `LexAI :: checkForForcedToolCalls() :: Detected accept team task invitation for ID: "${taskId}"`,
        );

        return {
          id: generateUUID(),
          toolName: 'acceptTeamTaskInvitation',
          parameters: {
            taskId,
          },
        };
      }
    }

    // Reject team task invitation pattern
    if (
      (lowerMessage.includes('reject') ||
        lowerMessage.includes('decline') ||
        lowerMessage.includes('refuse') ||
        lowerMessage.includes('deny')) &&
      (lowerMessage.includes('team task') ||
        lowerMessage.includes('duo task') ||
        lowerMessage.includes('team invitation') ||
        lowerMessage.includes('task invitation'))
    ) {
      // Try to extract task ID
      const taskIdMatches = userMessage.match(
        /task(?:\s+id)?(?:\s*:?\s*)([a-zA-Z0-9]+)/i,
      );
      let taskId = '';

      if (taskIdMatches && taskIdMatches[1]) {
        taskId = taskIdMatches[1].trim();

        console.log(
          `LexAI :: checkForForcedToolCalls() :: Detected reject team task invitation for ID: "${taskId}"`,
        );

        return {
          id: generateUUID(),
          toolName: 'rejectTeamTaskInvitation',
          parameters: {
            taskId,
          },
        };
      }
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
      `LexAI :: checkForForcedToolCalls() :: No forced tool calls detected`,
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
   * Check if this is a confirmation message for a previous request (like task deletion)
   * @param userMessage The user's message
   * @param conversation The current conversation
   * @returns Object with taskName if this is a confirmation, null otherwise
   */
  private isConfirmationMessage(
    userMessage: string,
    conversation: LexAIConversation,
  ): {taskName: string} | null {
    const lowerMessage = userMessage.toLowerCase().trim();
    console.log(
      `LexAI :: isConfirmationMessage() :: Checking if message is confirmation: "${lowerMessage}"`,
    );

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
      lowerMessage === 'go ahead' ||
      lowerMessage === 'i confirm' ||
      lowerMessage === 'please do' ||
      lowerMessage === "that's right" ||
      lowerMessage === 'thats right' ||
      lowerMessage === 'correct' ||
      lowerMessage === 'proceed' ||
      lowerMessage.includes('go ahead') ||
      lowerMessage.includes('sounds good') ||
      lowerMessage.includes('please do') ||
      lowerMessage.includes('that is correct') ||
      lowerMessage.includes('yes please');

    if (!isConfirmation) {
      console.log(
        `LexAI :: isConfirmationMessage() :: Not a confirmation message`,
      );
      return null;
    }

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
        console.log(
          `LexAI :: isConfirmationMessage() :: Last assistant message: "${content}"`,
        );

        // Enhanced task name extraction patterns
        // Look for patterns like "delete the task named X" or "Did you mean to delete X"
        const taskNameMatch =
          // Match "delete task X" patterns
          content.match(
            /delete(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "delete X" patterns
          content.match(/\bdelete\s+["']?([^"'?.,]+)["']?/i) ||
          // Match "remove task X" patterns
          content.match(
            /remove(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "cancel task X" patterns
          content.match(
            /cancel(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "would you like to delete" patterns
          content.match(
            /would you like (?:me )?to delete(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "mean the task named X" patterns (for correction suggestions)
          content.match(
            /mean(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "Did you mean task X" patterns
          content.match(
            /did you mean(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "referred to task X" patterns
          content.match(
            /referred to(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?/i,
          ) ||
          // Match "complete task X" or "mark X as complete" patterns
          content.match(
            /(?:complete|mark)(?:\s+the)?(?:\s+task)?(?:\s+named)?\s+["']?([^"'?.,]+)["']?(?:\s+as\s+(?:complete|done|finished))?/i,
          ) ||
          // Match "task X" as a fallback
          content.match(/\btask\s+["']?([^"'?.,]+)["']?/i);

        if (taskNameMatch && taskNameMatch[1]) {
          let extractedTaskName = taskNameMatch[1].trim();

          // Clean up the task name by removing any "the task" phrases
          console.log(
            `LexAI :: isConfirmationMessage() :: Cleaning task name "${extractedTaskName}"`,
          );

          // IMPROVED CLEANING: More thorough step-by-step cleaning
          // Check for "the task" prefix first (most specific check first)
          if (extractedTaskName.startsWith('the task ')) {
            console.log(
              `LexAI :: isConfirmationMessage() :: Removing 'the task' prefix`,
            );
            extractedTaskName = extractedTaskName.substring(9).trim();
          }
          // Then check for "the" prefix
          else if (extractedTaskName.startsWith('the ')) {
            console.log(
              `LexAI :: isConfirmationMessage() :: Removing 'the' prefix`,
            );
            extractedTaskName = extractedTaskName.substring(4).trim();
          }

          // Also handle cases where "the task" might appear mid-string
          if (extractedTaskName.includes(' the task ')) {
            console.log(
              `LexAI :: isConfirmationMessage() :: Removing ' the task ' from within task name`,
            );
            extractedTaskName = extractedTaskName
              .replace(/\s+the\s+task\s+/gi, ' ')
              .trim();
          }

          // If the task name contains "task" anywhere as a standalone word, remove it
          if (extractedTaskName.match(/\btask\b/i)) {
            console.log(
              `LexAI :: isConfirmationMessage() :: Removing standalone 'task' word`,
            );
            extractedTaskName = extractedTaskName
              .replace(/\btask\b/gi, '')
              .trim();
          }

          // Remove "task" suffix if present
          if (extractedTaskName.endsWith('task')) {
            console.log(
              `LexAI :: isConfirmationMessage() :: Removing 'task' suffix`,
            );
            extractedTaskName = extractedTaskName
              .substring(0, extractedTaskName.length - 5)
              .trim();
          }

          // After all cleaning, ensure we don't have multiple spaces
          extractedTaskName = extractedTaskName.replace(/\s+/g, ' ').trim();

          console.log(
            `LexAI :: isConfirmationMessage() :: Final extracted task name: "${extractedTaskName}"`,
          );
          return {taskName: extractedTaskName};
        } else {
          console.log(
            `LexAI :: isConfirmationMessage() :: No task name found in assistant message`,
          );
        }
      }
    }

    console.log(
      `LexAI :: isConfirmationMessage() :: No relevant previous message found`,
    );
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