/**
 * tree转list
 * @param tree
 * @param childrenField
 * @returns
 */
export function treeToList(tree, childrenField = 'children') {
  const res = [] // 用于存储递归结果（扁平数据）
  // 递归函数
  const fn = source => {
    source.forEach(el => {
      res.push(el)
      el[childrenField] && el[childrenField].length > 0 ? fn(el[childrenField]) : '' // 子级递归
    })
  }
  fn(tree)
  return res
}

/**
 * 过滤tree节点
 * @param tree
 * @param func
 * @param childrenField
 * @returns
 */
export function filterTree(tree, func, childrenField = 'children') {
  function listFilter(list) {
    return list
      .map(node => ({ ...node }))
      .filter(node => {
        node[childrenField] = node[childrenField] && listFilter(node[childrenField])
        return func(node) || (node[childrenField] && node[childrenField].length)
      })
  }

  return listFilter(tree)
}

/**
 * 删除tree节点
 * @param tree
 * @param func
 * @param childrenField
 * @returns
 */
export function deleteTreeNode(tree, func, childrenField = 'children') {
  function listFilter(list) {
    return list
      .map(node => ({ ...node }))
      .filter(node => {
        node[childrenField] = node[childrenField] && listFilter(node[childrenField])
        return !func(node)
      })
  }

  return listFilter(tree)
}

export function getTreeValueByField(tree, field = 'menuKey', childrenField = 'children') {
  const values = []
  function listFun(list) {
    for (let i = 0; i < list.length; i++) {
      const node = list[i]
      values.push(node[field])
      if (node[childrenField]) {
        listFun(node[childrenField])
      }
    }
  }
  listFun(tree)
  return values
}

export function findTreeNode(tree, func, childrenField = 'children') {
  const list = [...tree]
  for (let i = 0; i < list.length; i++) {
    const node = list[i]
    if (func(node)) return node
    node[childrenField] && list.push(...node[childrenField])
  }
  return null
}

export function getTreePath(tree, func, path = [], key = 'id', childrenField = 'children') {
  if (!tree) return []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    path.push(item[key])
    if (func(item)) return path
    if (item[childrenField]) {
      const findChildren = getTreePath(item[childrenField], func, path, key, childrenField)
      if (findChildren.length) return findChildren
    }
    path.pop()
  }
  return []
}

export function getTreePathNodes(tree, func, path = [], childrenField = 'children') {
  if (!tree) return []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    path.push(item)
    if (func(item)) return path
    if (item[childrenField]) {
      const findChildren = getTreePathNodes(item[childrenField], func, path, childrenField)
      if (findChildren.length) return findChildren
    }
    path.pop()
  }
  return []
}

export function getTreeIndexPath(tree, func, path = [], childrenField = 'children') {
  if (!tree) return []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    path.push(i)
    if (func(item)) return path
    if (item[childrenField]) {
      const findChildren = getTreeIndexPath(item[childrenField], func, path, childrenField)
      if (findChildren.length) return findChildren
    }
    path.pop()
  }
  return []
}

export function getTreePathByKeys(
  tree,
  keys,
  key = '',
  path = [],
  field = 'name',
  childrenField = 'children'
) {
  if (!tree) return []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    path.push(item)
    const keyIndex = keys.findIndex(p => p === key)
    if (item[field] === key && keyIndex >= keys.length - 1) {
      return path
    }
    if (item[childrenField]) {
      const findChildren = getTreePathByKeys(
        item[childrenField],
        keys,
        keys[keyIndex + 1],
        path,
        field,
        childrenField
      )
      if (findChildren.length) return findChildren
    }
    path.pop()
  }
  return []
}
