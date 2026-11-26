p = r"D:\xampp\htdocs\Rudra-silver\frontend\src\components\UserManagementPage.tsx"
s = open(p).read()

# addForm
s = s.replace(
    "  const [addForm, setAddForm] = useState({\n    name: '',\n    mobile: '',\n    password: '',\n    role: 'STAFF' as 'ADMIN' | 'STAFF',\n  });",
    "  const [addForm, setAddForm] = useState({\n    name: '',\n    mobile: '',\n    email: '',\n    password: '',\n    role: 'STAFF' as 'ADMIN' | 'STAFF',\n  });",
    1
)

# editForm
s = s.replace(
    "  const [editForm, setEditForm] = useState({\n    name: '',\n    mobile: '',\n    role: 'STAFF' as 'ADMIN' | 'STAFF',\n    is_active: true,\n  });",
    "  const [editForm, setEditForm] = useState({\n    name: '',\n    mobile: '',\n    email: '',\n    role: 'STAFF' as 'ADMIN' | 'STAFF',\n    is_active: true,\n  });",
    1
)

# addForm reset
s = s.replace(
    "      setAddForm({ name: '', mobile: '', password: '', role: 'STAFF' });",
    "      setAddForm({ name: '', mobile: '', email: '', password: '', role: 'STAFF' });",
    1
)

# handleAddSubmit validation: add email check after mobile check
s = s.replace(
    "    if (!addForm.password || addForm.password.length < 6) {\n      setAddError('Password must be at least 6 characters.');\n      return;\n    }",
    "    if (!addForm.email.trim() || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(addForm.email.trim())) {\n      setAddError('Valid email address is required.');\n      return;\n    }\n    if (!addForm.password || addForm.password.length < 6) {\n      setAddError('Password must be at least 6 characters.');\n      return;\n    }",
    1
)

# handleAddSubmit createUserApi include email
s = s.replace(
    "      await createUserApi({\n        name: addForm.name.trim(),\n        mobile: cleanMobile,\n        password: addForm.password,\n        role: addForm.role,\n      });",
    "      await createUserApi({\n        name: addForm.name.trim(),\n        mobile: cleanMobile,\n        email: addForm.email.trim(),\n        password: addForm.password,\n        role: addForm.role,\n      });",
    1
)

# openEditModal: include email
s = s.replace(
    "    setEditForm({\n      name: u.name,\n      mobile: u.mobile || '',\n      role: u.role,\n      is_active: u.is_active,\n    });",
    "    setEditForm({\n      name: u.name,\n      mobile: u.mobile || '',\n      email: u.email || '',\n      role: u.role,\n      is_active: u.is_active,\n    });",
    1
)

# handleEditSubmit validation: add email check after mobile
s = s.replace(
    "    const cleanMobile = editForm.mobile.trim().replace(/\\D/g, '');\n    if (!cleanMobile || cleanMobile.length < 10) {\n      setEditError('Valid 10-digit mobile number is required.');\n      return;\n    }\n\n    setEditLoading(true);",
    "    const cleanMobile = editForm.mobile.trim().replace(/\\D/g, '');\n    if (!cleanMobile || cleanMobile.length < 10) {\n      setEditError('Valid 10-digit mobile number is required.');\n      return;\n    }\n    if (!editForm.email.trim() || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(editForm.email.trim())) {\n      setEditError('Valid email address is required.');\n      return;\n    }\n\n    setEditLoading(true);",
    1
)

# handleEditSubmit updateUserApi include email
s = s.replace(
    "      await updateUserApi(selectedUser.id, {\n        name: editForm.name.trim(),\n        mobile: cleanMobile,\n        role: selectedUser.id === currentUser?.id ? undefined : editForm.role,\n        is_active: selectedUser.id === currentUser?.id ? undefined : editForm.is_active,\n      });",
    "      await updateUserApi(selectedUser.id, {\n        name: editForm.name.trim(),\n        mobile: cleanMobile,\n        email: editForm.email.trim(),\n        role: selectedUser.id === currentUser?.id ? undefined : editForm.role,\n        is_active: selectedUser.id === currentUser?.id ? undefined : editForm.is_active,\n      });",
    1
)

# Table header: add Email column after Mobile
s = s.replace(
    "                  <th className=\"p-3\">Mobile</th>\n                  <th className=\"p-3 text-center\">Role</th>",
    "                  <th className=\"p-3\">Mobile</th>\n                  <th className=\"p-3\">Email</th>\n                  <th className=\"p-3 text-center\">Role</th>",
    1
)

# colSpan 7 -> 8 (two occurrences)
s = s.replace("colSpan={7}", "colSpan={8}", 2)

# Table row: add Email cell after Mobile cell
s = s.replace(
    "                        {/* Mobile Number */}\n                        <td className=\"p-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]\">\n                          {formatMobile(u.mobile)}\n                        </td>\n",
    "                        {/* Mobile Number */}\n                        <td className=\"p-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]\">\n                          {formatMobile(u.mobile)}\n                        </td>\n\n                        {/* Email */}\n                        <td className=\"p-3 text-slate-700 dark:text-slate-300 text-[11px]\">\n                          {u.email || '—'}\n                        </td>\n",
    1
)

# search placeholder
s = s.replace(
    'placeholder="Search by name or mobile..."',
    'placeholder="Search by name, mobile or email..."',
    1
)

# Add email field in Add modal after mobile
s = s.replace(
    """              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Password *
                </label>""",
    """              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Password *
                </label>""",
    1
)

# Add email field in Edit modal after mobile
s = s.replace(
    """              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  System Role
                </label>""",
    """              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  System Role
                </label>""",
    1
)

# View modal: add email display after mobile
s = s.replace(
    "                  <span className=\"font-mono text-slate-800 dark:text-slate-200 mt-0.5 block\">\n                    {formatMobile(selectedUser.mobile)}\n                  </span>\n                </div>\n\n                <div className=\"p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]\">\n                  <span className=\"text-[10px] text-slate-500 block uppercase\">Registration Date</span>",
    "                  <span className=\"font-mono text-slate-800 dark:text-slate-200 mt-0.5 block\">\n                    {formatMobile(selectedUser.mobile)}\n                  </span>\n                </div>\n\n                <div className=\"p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]\">\n                  <span className=\"text-[10px] text-slate-500 block uppercase\">Email</span>\n                  <span className=\"text-slate-800 dark:text-slate-200 mt-0.5 block break-all\">\n                    {selectedUser.email || '—'}\n                  </span>\n                </div>\n\n                <div className=\"p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]\">\n                  <span className=\"text-[10px] text-slate-500 block uppercase\">Registration Date</span>",
    1
)

# Also view modal top mobile display add email? optional. Done.

open(p, "w").write(s)
print("done")
PY