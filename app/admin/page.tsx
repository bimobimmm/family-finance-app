'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type OverviewPayload = {
  stats: {
    transactions: number
    savingsTargets: number
    families: number
    familyMembers: number
    registeredUsers: number
    totalIncome: number
    totalExpense: number
    totalSavingsTarget: number
    totalSavingsCurrent: number
  }
  registeredUsers: Array<{
    id: string
    email?: string
    created_at?: string
    last_sign_in_at?: string
  }>
  recentTransactions: any[]
  recentSavingsTargets: any[]
  tables: string[]
}

type TablePayload = {
  table: string
  rows: any[]
}

function formatCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID')
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') {
    if (value.length > 80) return `${value.slice(0, 80)}...`
    return value
  }
  if (typeof value === 'number') return value.toLocaleString('id-ID')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return JSON.stringify(value)
}

function getColumns(rows: any[]) {
  const first = rows[0]
  if (!first) return []
  return Object.keys(first)
}

function serializeForInput(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function coerceInputValue(rawValue: string, originalValue: unknown) {
  if (rawValue === '') {
    if (originalValue === null || originalValue === undefined) return null
    return ''
  }

  if (typeof originalValue === 'number') {
    const parsed = Number(rawValue)
    return Number.isNaN(parsed) ? originalValue : parsed
  }

  if (typeof originalValue === 'boolean') {
    return rawValue === 'true'
  }

  if (
    originalValue &&
    typeof originalValue === 'object' &&
    !Array.isArray(originalValue)
  ) {
    try {
      return JSON.parse(rawValue)
    } catch {
      return originalValue
    }
  }

  return rawValue
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const [overview, setOverview] = useState<OverviewPayload | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('transactions')
  const [tableData, setTableData] = useState<TablePayload | null>(null)
  const [selectedTransactionUser, setSelectedTransactionUser] = useState<string>('all')
  const [selectedSavingsUser, setSelectedSavingsUser] = useState<string>('all')
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const tableColumns = useMemo(
    () => getColumns(tableData?.rows || []),
    [tableData?.rows],
  )

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>()
    ;(overview?.registeredUsers || []).forEach((row) => {
      map.set(row.id, row.email || `User ${row.id.slice(0, 8)}`)
    })
    return map
  }, [overview?.registeredUsers])

  const recentTransactionsByUser = useMemo(() => {
    const grouped = new Map<string, any[]>()
    ;(overview?.recentTransactions || []).forEach((row: any) => {
      const ownerId = row.user_id || 'unknown'
      const rows = grouped.get(ownerId) || []
      rows.push(row)
      grouped.set(ownerId, rows)
    })

    return Array.from(grouped.entries()).map(([ownerId, rows]) => ({
      ownerId,
      ownerLabel:
        userLabelById.get(ownerId) ||
        (ownerId === 'unknown' ? 'User tidak diketahui' : `User ${ownerId.slice(0, 8)}`),
      rows,
    }))
  }, [overview?.recentTransactions, userLabelById])

  const transactionUserOptions = useMemo(() => {
    return recentTransactionsByUser.map((group) => ({
      id: group.ownerId,
      label: group.ownerLabel,
    }))
  }, [recentTransactionsByUser])

  const visibleTransactionsByUser = useMemo(() => {
    if (selectedTransactionUser === 'all') return recentTransactionsByUser
    return recentTransactionsByUser.filter((group) => group.ownerId === selectedTransactionUser)
  }, [recentTransactionsByUser, selectedTransactionUser])

  const savingsUserOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(overview?.recentSavingsTargets || []).forEach((row: any) => {
      if (!row.user_id) return
      map.set(
        row.user_id,
        userLabelById.get(row.user_id) || `User ${String(row.user_id).slice(0, 8)}`,
      )
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [overview?.recentSavingsTargets, userLabelById])

  const visibleSavingsTargets = useMemo(() => {
    const rows = overview?.recentSavingsTargets || []
    if (selectedSavingsUser === 'all') return rows
    return rows.filter((row: any) => row.user_id === selectedSavingsUser)
  }, [overview?.recentSavingsTargets, selectedSavingsUser])

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAdminApi(path: string, init?: RequestInit) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push('/login')
      return null
    }

    const res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(init?.headers || {}),
      },
    })

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(payload.error || 'Request failed')
    }

    return payload
  }

  async function init() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUserEmail(session.user.email || '')

      const overviewPayload = await fetchAdminApi('/api/admin?mode=overview')
      if (!overviewPayload) return

      setOverview(overviewPayload)

      const defaultTable =
        overviewPayload.tables?.includes('transactions')
          ? 'transactions'
          : overviewPayload.tables?.[0]

      if (defaultTable) {
        setSelectedTable(defaultTable)
        const tablePayload = await fetchAdminApi(`/api/admin?mode=table&table=${defaultTable}`)
        if (tablePayload) setTableData(tablePayload)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await init()
    } finally {
      setRefreshing(false)
    }
  }

  async function handleTableChange(value: string) {
    setSelectedTable(value)
    setError(null)

    try {
      const payload = await fetchAdminApi(`/api/admin?mode=table&table=${value}`)
      if (payload) setTableData(payload)
    } catch (err: any) {
      setError(err?.message || 'Failed to load table')
    }
  }

  async function handleDeleteRow(id: string) {
    if (!id || !selectedTable) return

    const confirmed = window.confirm(`Delete row ${id} from ${selectedTable}?`)
    if (!confirmed) return

    try {
      await fetchAdminApi('/api/admin', {
        method: 'DELETE',
        body: JSON.stringify({
          table: selectedTable,
          id,
        }),
      })

      await handleTableChange(selectedTable)
    } catch (err: any) {
      setError(err?.message || 'Failed to delete row')
    }
  }

  function openEditDialog(row: any) {
    const fields: Record<string, string> = {}

    Object.keys(row).forEach((key) => {
      if (key === 'id') return
      fields[key] = serializeForInput(row[key])
    })

    setEditingRow(row)
    setEditValues(fields)
  }

  async function handleSaveEdit() {
    if (!editingRow?.id || !selectedTable) return

    setSavingEdit(true)
    setError(null)

    try {
      const updates: Record<string, unknown> = {}

      Object.keys(editValues).forEach((key) => {
        updates[key] = coerceInputValue(editValues[key], editingRow[key])
      })

      await fetchAdminApi('/api/admin', {
        method: 'PATCH',
        body: JSON.stringify({
          table: selectedTable,
          id: editingRow.id,
          updates,
        }),
      })

      setEditingRow(null)
      setEditValues({})
      await handleTableChange(selectedTable)
    } catch (err: any) {
      setError(err?.message || 'Failed to update row')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Signed in as {userEmail || '-'}</p>
            </div>
          </div>

          <Button className="w-full sm:w-auto" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Hub (Ringkas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold">{overview?.stats.transactions || 0}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">Savings Targets</p>
                    <p className="text-xl font-bold">{overview?.stats.savingsTargets || 0}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">Families</p>
                    <p className="text-xl font-bold">{overview?.stats.families || 0}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">Family Members</p>
                    <p className="text-xl font-bold">{overview?.stats.familyMembers || 0}</p>
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">Registered Users</p>
                    <p className="text-xl font-bold">{overview?.stats.registeredUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Global Cashflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Total income: <span className="font-semibold">{formatCurrency(overview?.stats.totalIncome || 0)}</span></p>
                  <p>Total expense: <span className="font-semibold">{formatCurrency(overview?.stats.totalExpense || 0)}</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Global Savings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Total target: <span className="font-semibold">{formatCurrency(overview?.stats.totalSavingsTarget || 0)}</span></p>
                  <p>Total current: <span className="font-semibold">{formatCurrency(overview?.stats.totalSavingsCurrent || 0)}</span></p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Transactions (Per User)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
                  <div className="w-full sm:w-72">
                    <Select value={selectedTransactionUser} onValueChange={setSelectedTransactionUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua user</SelectItem>
                        {transactionUserOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {visibleTransactionsByUser.map((group) => (
                    <div key={group.ownerId} className="border rounded-md p-3 space-y-2">
                      <p className="text-sm font-semibold">{group.ownerLabel}</p>
                      {group.rows.map((row: any) => (
                        <div
                          key={row.id}
                          className="rounded-md bg-muted/40 px-3 py-2 text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{row.category || row.type || 'Transaksi'}</span>
                            <span className="font-semibold">{formatCurrency(Number(row.amount || 0))}</span>
                          </div>
                          <p className="text-muted-foreground mt-1">{row.description || 'Tanpa deskripsi'}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(row.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                  {visibleTransactionsByUser.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Savings Targets (Per User)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="w-full sm:w-72">
                    <Select value={selectedSavingsUser} onValueChange={setSelectedSavingsUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua user</SelectItem>
                        {savingsUserOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {visibleSavingsTargets.map((row: any) => (
                      <div key={row.id} className="flex items-start justify-between text-sm border rounded-md px-3 py-2 gap-3">
                        <div>
                          <p className="font-medium">{row.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            Pemilik:{' '}
                            {userLabelById.get(row.user_id) ||
                              (row.user_id ? `User ${String(row.user_id).slice(0, 8)}` : '-')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Update: {formatDateTime(row.updated_at || row.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(Number(row.current_amount || 0))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            dari {formatCurrency(Number(row.target_amount || 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {visibleSavingsTargets.length === 0 && (
                      <p className="text-sm text-muted-foreground">Tidak ada data target tabungan.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Registered Emails ({overview?.stats.registeredUsers || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {(overview?.registeredUsers || []).map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm border rounded-md px-3 py-3 gap-2 bg-muted/20"
                  >
                    <div>
                      <p className="font-medium">{row.email || '-'}</p>
                      <p className="text-xs text-muted-foreground">ID: {row.id.slice(0, 8)}...</p>
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-right">
                      <p>Daftar: {formatDateTime(row.created_at)}</p>
                      <p>Last sign in: {formatDateTime(row.last_sign_in_at)}</p>
                    </div>
                  </div>
                ))}
                {(overview?.registeredUsers || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No registered users</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database Explorer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:w-64">
                    <Select value={selectedTable} onValueChange={handleTableChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose table" />
                      </SelectTrigger>
                      <SelectContent>
                        {(overview?.tables || []).map((table) => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleTableChange(selectedTable)}
                  >
                    Reload Table
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableColumns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {(tableData?.rows || []).map((row: any) => (
                      <TableRow key={row.id || JSON.stringify(row)}>
                        {tableColumns.map((column) => (
                          <TableCell key={`${row.id || 'no-id'}-${column}`}>
                            {formatCellValue(row[column])}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.id ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              no id
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {(tableData?.rows || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={tableColumns.length + 1} className="text-center text-muted-foreground">
                          No rows found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={Boolean(editingRow)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null)
            setEditValues({})
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>
              Table: {selectedTable} | ID: {editingRow?.id || '-'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {Object.keys(editValues).map((key) => {
              const original = editingRow?.[key]
              const isLongText =
                typeof editValues[key] === 'string' && editValues[key].length > 60

              return (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium">{key}</p>
                  {isLongText ? (
                    <Textarea
                      value={editValues[key]}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      value={editValues[key]}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    type: {original === null ? 'null' : typeof original}
                  </p>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingRow(null)
                setEditValues({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
