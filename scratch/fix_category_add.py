p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\categories\CategoryAddPage.tsx"
s = open(p).read()

# import
s = s.replace(
    "  fetchCategoryMetalTypesApi,\n} from '../../services/api';",
    "  fetchMetalStockFilterOptions,\n} from '../../services/api';",
    1
)

# state
s = s.replace(
    "  const [metalTypes, setMetalTypes] = useState<string[]>(['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND']);",
    "  const [metalItems, setMetalItems] = useState<string[]>([]);",
    1
)

# formData default metal_type: use empty string initially, set after fetch
s = s.replace(
    "    metal_type: 'SILVER',\n",
    "    metal_type: '',\n",
    1
)

# useEffect fetch
old_effect = """    fetchCategoryMetalTypesApi()
      .then((types) => {
        if (isMounted) {
          setMetalTypes(types);
          if (types.length > 0 && !types.includes(formData.metal_type)) {
            setFormData((prev) => ({ ...prev, metal_type: types[0] }));
          }
        }
      })
      .catch((err) => console.error('Failed to load metal types:', err));"""
new_effect = """    fetchMetalStockFilterOptions()
      .then((opts) => {
        if (isMounted) {
          const items = opts.items || [];
          setMetalItems(items);
          if (items.length > 0 && !items.includes(formData.metal_type)) {
            setFormData((prev) => ({ ...prev, metal_type: items[0] }));
          }
        }
      })
      .catch((err) => console.error('Failed to load metal stock items:', err));"""
assert old_effect in s
s = s.replace(old_effect, new_effect, 1)

# dropdown options
s = s.replace(
    "              {metalTypes.map((mt) => (\n                <option key={mt} value={mt}>\n                  {mt}\n                </option>\n              ))}",
    "              {metalItems.map((it) => (\n                <option key={it} value={it}>\n                  {it}\n                </option>\n              ))}",
    1
)

# helper text
s = s.replace(
    "            <p className=\"text-[11px] text-slate-400 mt-1\">Pre-defined precious metal classification.</p>",
    "            <p className=\"text-[11px] text-slate-400 mt-1\">Select a Metal Stock item.</p>",
    1
)

open(p, "w").write(s)
print("done")
PY