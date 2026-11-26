p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\categories\CategoryEditPage.tsx"
s = open(p).read()

s = s.replace(
    "  fetchCategoryMetalTypesApi,\n} from '../../services/api';",
    "  fetchMetalStockFilterOptions,\n} from '../../services/api';",
    1
)

s = s.replace(
    "  const [metalTypes, setMetalTypes] = useState<string[]>(['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND']);",
    "  const [metalItems, setMetalItems] = useState<string[]>([]);",
    1
)

s = s.replace(
    "  const [formData, setFormData] = useState({\n    metal_type: 'SILVER',\n    name: '',\n    hsn_code: '7113',\n  });",
    "  const [formData, setFormData] = useState({\n    metal_type: '',\n    name: '',\n    hsn_code: '7113',\n  });",
    1
)

s = s.replace(
    "    Promise.all([fetchCategoryByIdApi(recordId), fetchCategoryMetalTypesApi()])\n      .then(([cat, types]) => {\n        if (!isMounted) return;\n        setMetalTypes(types);\n        setOriginalName(cat.name || '');\n        setFormData({\n          metal_type: cat.metal_type || 'SILVER',\n          name: cat.name || '',\n          hsn_code: cat.hsn_code || '7113',\n        });\n      })",
    "    Promise.all([fetchCategoryByIdApi(recordId), fetchMetalStockFilterOptions()])\n      .then(([cat, opts]) => {\n        if (!isMounted) return;\n        const items = opts.items || [];\n        setMetalItems(items);\n        setOriginalName(cat.name || '');\n        setFormData({\n          metal_type: cat.metal_type || (items[0] || ''),\n          name: cat.name || '',\n          hsn_code: cat.hsn_code || '7113',\n        });\n      })",
    1
)

s = s.replace(
    "              {metalTypes.map((mt) => (\n                <option key={mt} value={mt}>\n                  {mt}\n                </option>\n              ))}",
    "              {metalItems.map((it) => (\n                <option key={it} value={it}>\n                  {it}\n                </option>\n              ))}",
    1
)

open(p, "w").write(s)
print("done")
PY