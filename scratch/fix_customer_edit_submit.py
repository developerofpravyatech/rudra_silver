p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\customers\CustomerEditPage.tsx"
s = open(p, encoding='utf-8').read()

s = s.replace(
    "  const validateForm = (): boolean => {",
    "  const validateForm = (): Record<string, string> => {",
    1
)

s = s.replace(
    "    return Object.keys(newErrors).length === 0;",
    "    return newErrors;",
    1
)

old_hs = """    if (!validateForm()) {
      return;
    }"""
new_hs = """    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }"""
assert old_hs in s, "hs not found"
s = s.replace(old_hs, new_hs, 1)

# button
s = s.replace(
    '          <button\n            type="button"\n            onClick={handleSubmit}\n            disabled={isSubmitting}',
    '          <button\n            type="submit"\n            form="customer-edit-form"\n            disabled={isSubmitting}',
    1
)

# form
s = s.replace(
    '<form onSubmit={handleSubmit} className="space-y-6">',
    '<form id="customer-edit-form" onSubmit={handleSubmit} className="space-y-6">',
    1
)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY