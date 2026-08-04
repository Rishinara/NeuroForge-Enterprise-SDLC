import os
import re

entities_dir = r"d:\NeuroForge-Enterprise-SDLC\Backend\src\main\java\com\neuroforge\entity"

# We want to add @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
# to all @ManyToOne mappings, except maybe assignees. Actually, it's safer to only add it to @ManyToOne for Project, Organization, Task, Sprint.

cascade_targets = ["Project", "Organization", "Task", "Sprint", "Spec"]

for filename in os.listdir(entities_dir):
    if not filename.endswith(".java"):
        continue
    filepath = os.path.join(entities_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # regex to find @ManyToOne(...)
    # followed by @JoinColumn(...)
    # followed by private <Target> <name>;
    
    def replacer(match):
        many_to_one = match.group(1)
        join_column = match.group(2)
        field_type = match.group(3)
        field_name = match.group(4)
        
        if field_type in cascade_targets:
            return f"{many_to_one}\n    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)\n{join_column}    private {field_type} {field_name};"
        return match.group(0)

    pattern = r"(@ManyToOne.*?)\n\s*(@JoinColumn.*?)\n\s*private\s+(\w+)\s+(\w+);"
    new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename}")
