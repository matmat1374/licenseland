import os
import glob
import re

auth_check_admin = """const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 403 });"""

auth_check_supplier = """const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPPLIER') return NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 403 });"""

def update_file(path, is_admin):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content

    # Replace old auth check
    old_admin_pattern = r'const\s+session\s*=\s*await\s+getServerSession\s*\(\s*authOptions\s*\)\s*;\s*if\s*\(!session\?.user\?.id\s*\|\|\s*session\.user\.role\s*!==\s*["\']ADMIN["\']\)\s*return\s*NextResponse\.json\(\{\s*ok:\s*false,\s*message:\s*["\']دسترسی غیرمجاز["\']\s*\}\s*,\s*\{\s*status:\s*403\s*\}\);?'
    old_supplier_pattern = r'const\s+session\s*=\s*await\s+getServerSession\s*\(\s*authOptions\s*\)\s*;\s*if\s*\(!session\?.user\?.id\s*\|\|\s*session\.user\.role\s*!==\s*["\']SUPPLIER["\']\)\s*return\s*NextResponse\.json\(\{\s*ok:\s*false,\s*message:\s*["\']دسترسی غیرمجاز["\']\s*\}\s*,\s*\{\s*status:\s*403\s*\}\);?'

    # Wait, maybe they just have a generic check, let's just do a string replacement on the start of the function.
    
    # 2. Fix dynamic params
    new_content = re.sub(
        r'\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}',
        r'context: { params: Promise<{ \1: string }> }',
        new_content
    )
    new_content = re.sub(
        r'req: NextRequest,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}',
        r'req: NextRequest, context: { params: Promise<{ \1: string }> }',
        new_content
    )
    
    # Insert "const { id } = await context.params;"
    # we'll look for context: { params: Promise<{ id: string }> }
    # and then add the line
    if 'context: { params: Promise<{' in new_content:
        # We need to replace references to params.id to id
        new_content = re.sub(r'params\.([a-zA-Z0-9_]+)', r'\1', new_content)
        # Add the destructuring
        # Find the function signature
        def repl(m):
            func_sig = m.group(1)
            body = m.group(2)
            param_name = re.search(r'Promise<\{\s*([a-zA-Z0-9_]+)', func_sig).group(1)
            return func_sig + ' {\n  const { ' + param_name + ' } = await context.params;\n' + body
        
        new_content = re.sub(r'(\b(?:export\s+)?(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*context:\s*\{\s*params:\s*Promise<\{[^}]+\}>\s*\}[^)]*\))\s*\{\s*(?!const\s*\{\s*[a-zA-Z0-9_]+\s*\}\s*=\s*await\s+context\.params;)(.*)', repl, new_content, count=1, flags=re.DOTALL)
        
        # apply to all functions
        # actually a simpler regex:
        for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            pattern = re.compile(r'(export\s+async\s+function\s+' + method + r'\s*\([^)]*context:\s*\{\s*params:\s*Promise<\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}>\s*\}[^)]*\)\s*\{)(?!\s*const\s*\{\s*\2\s*\}\s*=\s*await\s+context\.params;)')
            new_content = pattern.sub(r'\1\n  const { \2 } = await context.params;', new_content)

    if content != new_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated params for {path}")

def main():
    admin_files = glob.glob('src/app/api/admin/**/*.ts', recursive=True)
    supplier_files = glob.glob('src/app/api/supplier/**/*.ts', recursive=True)
    for f in admin_files:
        update_file(f, True)
    for f in supplier_files:
        update_file(f, False)

if __name__ == "__main__":
    main()
