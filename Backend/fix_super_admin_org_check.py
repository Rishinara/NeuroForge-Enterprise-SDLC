import os
import re

services_dir = r"d:\NeuroForge-Enterprise-SDLC\Backend\src\main\java\com\neuroforge\service\impl"

pattern = re.compile(r'if \(!project\.getOrganization\(\)\.getId\(\)\.equals\(user\.getOrganization\(\)\.getId\(\)\)\) \{(.*?)\}', re.DOTALL)

replacement = r'''if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {\1}'''

for filename in os.listdir(services_dir):
    if not filename.endswith("ServiceImpl.java"):
        continue
    filepath = os.path.join(services_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = pattern.sub(replacement, content)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename}")
