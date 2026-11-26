p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\services\karigarApi.ts"
s = open(p, encoding='utf-8').read()
s = s.replace("import { getAuthHeaders } from './api';\n  KarigarRecord,", "  KarigarRecord,", 1)
# add import after the type import closing
s = s.replace("} from '../types/karigar';\n", "} from '../types/karigar';\nimport { getAuthHeaders } from './api';\n", 1)
open(p, "w", encoding='utf-8').write(s)
print("done")
PY