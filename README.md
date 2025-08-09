# Month View Task Planner

### Live Link: https://month-view-task-planner.vercel.app/

Month View Task Planner is a responsive, interactive, single-page application built with React and TypeScript. It provides a full-month calendar view for creating, managing, and visualizing tasks over time. Users can drag to create tasks, drag to move them, and resize their duration, all within an intuitive and clean interface.

## Features

*   **Interactive Calendar Grid**: A full 6-week month view to visualize your schedule.
*   **Drag-to-Create**: Click and drag across calendar days to create a new task for that date range.
*   **Drag-and-Drop Tasks**: Easily move tasks to different dates by dragging them across the calendar.
*   **Resizable Tasks**: Adjust the start or end date of a task by dragging its edges.
*   **Task Categorization**: Organize tasks into categories: "To Do", "In Progress", "Review", and "Completed", each with a distinct color.
*   **Dynamic Filtering**:
    *   Filter tasks by one or more categories.
    *   Filter by task name with a real-time search input.
    *   Filter by a relative time window (e.g., "Within 1 week").
*   **Task Management Modal**: Click any task to open a modal where you can edit its title, category, and specific dates, or delete it.
*   **User Feedback Toasts**: Get instant visual feedback for actions like creating, updating, moving, or deleting tasks.
*   **Local Storage Persistence**: Optionally save your tasks in the browser's local storage to persist them across sessions.
*   **Responsive Design**: A user-friendly experience on both desktop and mobile devices.

## Tech Stack

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Drag & Drop**: `@dnd-kit/core`
*   **Date Management**: `date-fns`
*   **Icons**: `lucide-react`

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/amareshotta01/Month-View-Task-Planner.git
    cd Month-View-Task-Planner
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## How to Use

*   **Create a Task**: On the calendar, click on a day and drag your cursor to another day. A modal will pop up to let you enter the task details.
*   **Move a Task**: Click and hold a task bar, then drag it to a new position on the calendar.
*   **Resize a Task**: Hover over the left or right edge of a task bar until the cursor changes. Click and drag to change the task's duration.
*   **Edit or Delete a Task**: Simply click on any task bar. This will open a modal where you can modify its details or delete it.
*   **Filter Tasks**: Use the "Filters" panel on the left (or under the "Filters" dropdown on mobile) to narrow down the visible tasks by name, category, or time window.
*   **Save Your Work**: Check the "Persist tasks" box at the bottom of the filter panel to save all your tasks to your browser's local storage.

## Project Structure

The core application logic is located in the `src/` directory.

```
src/
├── components/
│   ├── Calendar.tsx      # Main calendar grid, handles layout and task placement
│   ├── FilterPanel.tsx   # Sidebar for filtering tasks by category, name, and time
│   ├── TaskBar.tsx       # Component for a single task event on the calendar
│   ├── TaskModal.tsx     # Modal for creating and editing tasks
│   ├── ToastProvider.tsx # Manages and displays system notifications
│   └── types.ts          # Core TypeScript types (Task, Category, etc.)
├── App.tsx               # Root component, manages global state and logic
└── main.tsx              # Application entry point
