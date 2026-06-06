import sys
import os
import subprocess

def main():
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/bulkUserImport.py <path-to-excel-file>")
        print("Required columns: Name, Year, Room Number, Email")
        sys.exit(1)

    file_path = sys.argv[1]
    
    # Locate the sibling JS script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    node_script = os.path.join(script_dir, "bulkUserImport.js")
    
    if not os.path.exists(node_script):
        print(f"Error: Sibling Node script not found at: {node_script}")
        sys.exit(1)
        
    try:
        # Execute the Node.js CLI script, letting it hook directly into current stdin/stdout
        result = subprocess.run(["node", node_script, file_path], check=False)
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Error: Node.js is not installed or not available in the system PATH.")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nImport cancelled by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()
