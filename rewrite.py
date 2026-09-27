import os
import subprocess
import re

# Get all commits
result = subprocess.run(["git", "log", "--format=%H", "master"], capture_output=True, text=True)
commits = result.stdout.strip().split("\n")
commits.reverse() # Oldest to newest

print(f"Rewriting {len(commits)} commits...")

subprocess.run(["git", "checkout", "--orphan", "clean-master"])
subprocess.run(["git", "rm", "-rf", "."])

for i, commit in enumerate(commits):
    print(f"Processing {commit}...")
    # Get the commit message
    msg_result = subprocess.run(["git", "log", "-1", "--format=%B", commit], capture_output=True, text=True)
    msg = msg_result.stdout
    
    # Strip Co-authored-by
    msg = re.sub(r'Co-authored-by: monkeycode-ai.*', '', msg, flags=re.IGNORECASE)
    msg = msg.strip()
    
    with open("commit_msg.txt", "w", encoding="utf-8") as f:
        f.write(msg)
    
    # Checkout the files from the commit
    subprocess.run(["git", "checkout", commit, "--", "."])
    
    # Commit with new author
    subprocess.run(["git", "commit", "-F", "commit_msg.txt", "--author", "Luv Goel <luv@luv-goel.dev>"])

# Swap branches
subprocess.run(["git", "branch", "-D", "master"])
subprocess.run(["git", "branch", "-M", "master"])
subprocess.run(["git", "rm", "rewrite.py"])
subprocess.run(["git", "rm", "commit_msg.txt"])
subprocess.run(["git", "commit", "--amend", "--no-edit"])

print("Done rewriting commits!")
