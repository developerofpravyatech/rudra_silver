p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\categories\CategoryListPage.tsx"
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
    "    fetchCategoryMetalTypesApi()\n      .then((types) => {\n        if (isMounted) setMetalTypes(types);\n      })\n      .catch((err) => console.error('Failed to load metal types:', err));",
    "    fetchMetalStockFilterOptions()\n      .then((opts) => {\n        if (isMounted) setMetalItems(opts.items || []);\n      })\n      .catch((err) => console.error('Failed to load metal stock items:', err));",
    1
)

s = s.replace(
    "                  {metalTypes.map((mt) => (",
    "                  {metalItems.map((it) => (",
    1
)

# update option value/label inside map? The map likely uses mt. Let's inspect.
open(p, "w").write(s)
print("done")
PY