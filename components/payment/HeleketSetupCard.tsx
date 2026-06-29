"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  createPaymentType,
  getPaymentTypes,
  PaymentType,
  updatePaymentType,
} from "@/lib/apiservice";
import {
  getHeleketCallbackUrl,
  HELEKET_API_URL,
  HELEKET_CURRENCIES,
  HELEKET_MERCHANT_URL,
  HELEKET_PAYMENT_TYPE_NAME,
  HELEKET_SUPPORT_URL,
} from "@/lib/heleket-config";

export function HeleketSetupCard() {
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<PaymentType | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const callbackUrl = getHeleketCallbackUrl();

  const loadHeleket = useCallback(async () => {
    try {
      setLoading(true);
      const types = await getPaymentTypes();
      const heleket = types.find((pt) => pt.name === HELEKET_PAYMENT_TYPE_NAME) ?? null;
      setExisting(heleket);
      if (heleket) {
        setApiKey(heleket.api_key);
        setIsActive(heleket.is_active);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Xato",
        description: "Heleket sozlamalarini yuklab bo'lmadi",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeleket();
  }, [loadHeleket]);

  const copyCallbackUrl = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      toast({ title: "Nusxa olindi", description: "Callback URL buferga nusxalandi." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Xato", description: "Nusxa olishda xato" });
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({ variant: "destructive", title: "Xato", description: "API key kiriting" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: HELEKET_PAYMENT_TYPE_NAME,
        api_url: HELEKET_API_URL,
        api_key: apiKey.trim(),
        is_active: isActive,
      };
      if (existing) {
        const updated = await updatePaymentType(existing.id, payload);
        setExisting(updated);
        toast({ title: "Saqlandi", description: "Heleket sozlamalari yangilandi." });
      } else {
        const created = await createPaymentType(payload);
        setExisting(created);
        toast({ title: "Saqlandi", description: "Heleket muvaffaqiyatli sozlandi." });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xato",
        description: (err as { message?: string }).message || "Saqlashda xato yuz berdi",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Heleket sozlash</h2>
          <p className="text-sm text-muted-foreground">Kripto to'lovlar (USDT, BTC, ETH va boshqalar)</p>
        </div>
        {existing ? (
          <Badge variant="default" className="bg-green-600">
            <Check className="mr-1 h-3 w-3" />
            Sozlangan
          </Badge>
        ) : (
          <Badge variant="secondary">Sozlanmagan</Badge>
        )}
      </div>

      <Alert>
        <AlertTitle>Muhim</AlertTitle>
        <AlertDescription>
          Nom aniq <strong>{HELEKET_PAYMENT_TYPE_NAME}</strong> bo'lishi shart — backend shu nom orqali Heleket ni topadi.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Heleket akkaunt</CardTitle>
            <CardDescription>Merchant akkaunt oching va tasdiqlang (KYC)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href={HELEKET_MERCHANT_URL} target="_blank" rel="noopener noreferrer">
                heleket.com ga o'tish
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. API key va Callback URL</CardTitle>
            <CardDescription>Heleket dashboard → Integratsiya / API bo'limi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>Callback (Webhook) URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={callbackUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copyCallbackUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Bu URL ni Heleket merchant dashboard ga kiriting.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Admin panelda saqlash</CardTitle>
          <CardDescription>Heleket dashboard dan olingan Merchant API Key ni kiriting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="grid gap-2">
            <Label>Nom</Label>
            <Input readOnly value={HELEKET_PAYMENT_TYPE_NAME} />
          </div>
          <div className="grid gap-2">
            <Label>API URL</Label>
            <Input readOnly value={HELEKET_API_URL} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="heleket-api-key">API Key *</Label>
            <Input
              id="heleket-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Heleket Merchant API Key"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="heleket-active">Faol</Label>
            <Switch id="heleket-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saqlanmoqda..." : existing ? "Yangilash" : "Saqlash"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qabul qilinadigan valyutalar</CardTitle>
          <CardDescription>Frontend `currency` parametrida belgilanadi. Default: USDT</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Valyuta</TableHead>
                <TableHead>Belgi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HELEKET_CURRENCIES.map((c) => (
                <TableRow key={c.name}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Muammo tug'ilsa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">&quot;Heleket is not configured in admin&quot;</strong> — bu yerda{" "}
            {HELEKET_PAYMENT_TYPE_NAME} nomli to'lov turi yo'q yoki nofaol.
          </p>
          <p>
            <strong className="text-foreground">&quot;Invalid sign&quot;</strong> — API key noto'g'ri yoki webhook formati o'zgargan.
          </p>
          <p>
            <strong className="text-foreground">502 xato</strong> — Heleket API ga ulanib bo'lmayapti.
          </p>
          <Button variant="link" className="h-auto p-0" asChild>
            <a href={HELEKET_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              Heleket texnik qo'llab-quvvatlash
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
