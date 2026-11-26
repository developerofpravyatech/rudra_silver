p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\karigar\KarigarEditPage.tsx"
s = open(p, encoding='utf-8').read()
s = s.replace("onChange={v => set('name', v)}", "onChange={v => set('karigar_name', v)}", 1)
s = s.replace("onChange={v => set('phone', v)}", "onChange={v => set('alternate_mobile', v)}", 1)
s = s.replace("onChange={v => set('email', v)}", "onChange={v => set('narration', v)}", 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY