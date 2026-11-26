p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\customers\CustomerAddPage.tsx"
s = open(p, encoding='utf-8').read()

# validateForm signature: change return type and return newErrors
s = s.replace(
    "  const validateForm = (): boolean => {",
    "  const validateForm = (): Record<string, string> => {",
    1
)

# remove internal setErrors call? Keep it but also return newErrors. We need change final return.
s = s.replace(
    "    setErrors(newErrors);\n    const firstInvalid = Object.keys(newErrors)[0];",
    "    setErrors(newErrors);\n    const firstInvalid = Object.keys(newErrors)[0];",
    1
)

s = s.replace(
    "    return Object.keys(newErrors).length === 0;",
    "    return newErrors;",
    1
)

# handleSubmit
old_hs = """    if (!validateForm()) {
      return;
    }"""
new_hs = """    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }"""
assert old_hs in s
s = s.replace(old_hs, new_hs, 1)

# button: type button -> submit, remove onClick, add form attr
s = s.replace(
    '          <button\n            type="button"\n            onClick={handleSubmit}\n            disabled={isSubmitting}',
    '          <button\n            type="submit"\n            form="customer-add-form"\n            disabled={isSubmitting}',
    1
)

# form add id
s = s.replace(
    '<form onSubmit={handleSubmit} className="space-y-6">',
    '<form id="customer-add-form" onSubmit={handleSubmit} className="space-y-6">',
    1
)

open(p, "w", encoding='utf-8').write(s)
print("done")
PY