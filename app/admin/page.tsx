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
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const tableColumns = useMemo(
    () => getColumns(tableData?.rows || []),
    [tableData?.rows],
  )

  useEffect(() => {
    init()
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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

          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
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
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transactions</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.stats.transactions || 0}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Savings Targets</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.stats.savingsTargets || 0}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Families</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.stats.families || 0}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Family Members</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.stats.familyMembers || 0}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registered Users</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.stats.registeredUsers || 0}
                </CardContent>
              </Card>
            </div>

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
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(overview?.recentTransactions || []).map((row: any) => (
                    <div key={row.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                      <span>{row.category || '-'}</span>
                      <span className="font-semibold">{formatCurrency(Number(row.amount || 0))}</span>
                    </div>
                  ))}
                  {(overview?.recentTransactions || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Savings Targets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(overview?.recentSavingsTargets || []).map((row: any) => (
                    <div key={row.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                      <span>{row.name || '-'}</span>
                      <span className="font-semibold">{formatCurrency(Number(row.target_amount || 0))}</span>
                    </div>
                  ))}
                  {(overview?.recentSavingsTargets || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {(overview?.registeredUsers || []).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                  >
                    <span>{row.email || '-'}</span>
                    <span className="text-muted-foreground">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString('id-ID')
                        : '-'}
                    </span>
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
                <div className="flex items-center gap-3">
                  <div className="w-64">
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
                          <TableCell key={`${row.id}-${column}`}>
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
