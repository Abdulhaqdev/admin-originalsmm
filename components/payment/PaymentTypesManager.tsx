"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  createPaymentType,
  deletePaymentType,
  getPaymentTypes,
  PaymentType,
  updatePaymentType,
} from "@/lib/apiservice";

const emptyForm = {
  name: "",
  api_url: "",
  api_key: "",
  is_active: true,
};

export function PaymentTypesManager() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});

  const loadPaymentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentTypes();
      setPaymentTypes(data);
    } catch (err) {
      setError((err as { message?: string }).message || "To'lov turlarini yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentTypes();
  }, [loadPaymentTypes]);

  const validate = (data: typeof emptyForm) => {
    const errors: typeof formErrors = {};
    if (!data.name.trim()) errors.name = "Nom majburiy";
    if (!data.api_url.trim()) errors.api_url = "API URL majburiy";
    else if (!/^https?:\/\//.test(data.api_url)) errors.api_url = "URL http:// yoki https:// bilan boshlanishi kerak";
    if (!data.api_key.trim()) errors.api_key = "API key majburiy";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (paymentType: PaymentType) => {
    setEditing(paymentType);
    setForm({
      name: paymentType.name,
      api_url: paymentType.api_url,
      api_key: paymentType.api_key,
      is_active: paymentType.is_active,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!validate(form)) return;
    try {
      if (editing) {
        const updated = await updatePaymentType(editing.id, form);
        setPaymentTypes((prev) => prev.map((pt) => (pt.id === updated.id ? updated : pt)));
        toast({ title: "Yangilandi", description: "To'lov turi muvaffaqiyatli yangilandi." });
      } else {
        const created = await createPaymentType(form);
        setPaymentTypes((prev) => [...prev, created]);
        toast({ title: "Qo'shildi", description: "Yangi to'lov turi yaratildi." });
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xato",
        description: (err as { message?: string }).message || "Saqlashda xato yuz berdi",
      });
    }
  };

  const handleDelete = async () => {
    if (toDelete === null) return;
    try {
      await deletePaymentType(toDelete);
      setPaymentTypes((prev) => prev.filter((pt) => pt.id !== toDelete));
      setToDelete(null);
      setDeleteDialogOpen(false);
      toast({ title: "O'chirildi", description: "To'lov turi o'chirildi." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xato",
        description: (err as { message?: string }).message || "O'chirishda xato yuz berdi",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">To'lov turlari</h2>
          <p className="text-sm text-muted-foreground">Click, Payeer, Heleket va boshqa to'lov tizimlarini boshqaring.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Qo'shish
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>API URL</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentTypes.map((pt) => (
                  <TableRow key={pt.id}>
                    <TableCell className="font-medium">{pt.name}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{pt.api_url}</TableCell>
                    <TableCell>
                      {pt.is_active ? (
                        <Badge variant="default" className="bg-green-600">Faol</Badge>
                      ) : (
                        <Badge variant="secondary">Nofaol</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(pt)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setToDelete(pt.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paymentTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      To'lov turlari topilmadi. Heleket yoki boshqa tizim qo'shing.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "To'lov turini tahrirlash" : "To'lov turi qo'shish"}
        description="Nom, API URL va API key ni kiriting."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave}>{editing ? "Saqlash" : "Qo'shish"}</Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pt-name">Nom *</Label>
            <Input
              id="pt-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: Heleket"
            />
            {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pt-api-url">API URL *</Label>
            <Input
              id="pt-api-url"
              value={form.api_url}
              onChange={(e) => setForm({ ...form, api_url: e.target.value })}
              placeholder="https://api.heleket.com/v1"
            />
            {formErrors.api_url && <p className="text-sm text-destructive">{formErrors.api_url}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pt-api-key">API Key *</Label>
            <Input
              id="pt-api-key"
              type="password"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="Merchant API key"
            />
            {formErrors.api_key && <p className="text-sm text-destructive">{formErrors.api_key}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="pt-active">Faol</Label>
            <Switch
              id="pt-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="To'lov turini o'chirish"
        description="Bu amalni qaytarib bo'lmaydi. Davom etasizmi?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              O'chirish
            </Button>
          </>
        }
        children={undefined}
      />
    </div>
  );
}
