"""
Simple command-line To-Do List app.
Usage: run the script and follow the menu prompts.
"""

tasks = []

def show_menu():
    print("\n--- TO-DO LIST ---")
    print("1. View tasks")
    print("2. Add task")
    print("3. Mark task as done")
    print("4. Delete task")
    print("5. Exit")

def view_tasks():
    if not tasks:
        print("No tasks yet!")
        return
    for i, task in enumerate(tasks, start=1):
        status = "✓" if task["done"] else " "
        print(f"{i}. [{status}] {task['name']}")

def add_task():
    name = input("Enter task name: ")
    tasks.append({"name": name, "done": False})
    print(f"Added: {name}")

def mark_done():
    view_tasks()
    if not tasks:
        return
    try:
        num = int(input("Enter task number to mark done: "))
        tasks[num - 1]["done"] = True
        print("Task marked as done!")
    except (ValueError, IndexError):
        print("Invalid task number.")

def delete_task():
    view_tasks()
    if not tasks:
        return
    try:
        num = int(input("Enter task number to delete: "))
        removed = tasks.pop(num - 1)
        print(f"Deleted: {removed['name']}")
    except (ValueError, IndexError):
        print("Invalid task number.")

def main():
    while True:
        show_menu()
        choice = input("Choose an option (1-5): ")

        if choice == "1":
            view_tasks()
        elif choice == "2":
            add_task()
        elif choice == "3":
            mark_done()
        elif choice == "4":
            delete_task()
        elif choice == "5":
            print("Goodbye!")
            break
        else:
            print("Invalid choice, try again.")

if __name__ == "__main__":
    main()
