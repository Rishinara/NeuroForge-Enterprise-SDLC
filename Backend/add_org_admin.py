import os
import re

controllers_dir = r"d:\NeuroForge-Enterprise-SDLC\Backend\src\main\java\com\neuroforge\controller"

for filename in os.listdir(controllers_dir):
    if not filename.endswith(".java"):
        continue
    filepath = os.path.join(controllers_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # regex to find @PreAuthorize("hasAnyRole(...)") and add 'ORG_ADMIN' if not there
    def replacer(match):
        preauth = match.group(0)
        roles = match.group(1)
        if "'ORG_ADMIN'" not in roles and ('SUPER_ADMIN' in roles or 'PROJECT_MANAGER' in roles):
            new_roles = roles + ", 'ORG_ADMIN'"
            return preauth.replace(roles, new_roles)
        return preauth

    pattern = r'@PreAuthorize\("hasAnyRole\((.*?)\)"\)'
    new_content = re.sub(pattern, replacer, content)
    
    # Also handle hasRole('SUPER_ADMIN') to become hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN')
    # Actually most use hasAnyRole
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename}")
