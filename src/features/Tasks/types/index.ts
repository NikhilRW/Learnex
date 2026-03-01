import {Task} from 'shared/types/taskTypes';

// ─── Screen-level props ───────────────────────────────────────────────────────

export interface TaskItemProps {
  item: Task;
  isDark: boolean;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
}

export interface DuoTaskItemProps {
  item: Task;
  isDark: boolean;
  currentUserId: string;
  onPress: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (task: Task) => string;
  getCollaboratorText: (task: Task) => string;
}

export interface InvitationItemProps {
  item: Task;
  isDark: boolean;
  currentUserId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

// ─── Shared filter bar ────────────────────────────────────────────────────────

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterBarProps {
  filters: FilterOption[];
  selectedFilter: string;
  isDark: boolean;
  onSelectFilter: (filter: string) => void;
}

// ─── Modal prop interfaces ────────────────────────────────────────────────────

export interface TaskModalProps {
  modalVisible: boolean;
  isEditMode: boolean;
  isDark: boolean;
  newTask: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  onClose: () => void;
  onUpdateTask: () => void;
  onChangeTask: (
    task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => void;
  getPriorityColor: (priority: string) => string;
}

export interface DuoTaskModalProps {
  modalVisible: boolean;
  isEditMode: boolean;
  isDark: boolean;
  task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  onClose: () => void;
  onSave: () => void;
  onChangeTask: (
    task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => void;
  getPriorityColor: (priority: string) => string;
}

export interface DuoTaskDetailsModalProps {
  modalVisible: boolean;
  isDark: boolean;
  task: Task;
  onClose: () => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
}
