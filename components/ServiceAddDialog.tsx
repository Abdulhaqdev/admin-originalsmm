import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { DurationInput } from "@/components/ui/duration-input";
import { FormMessage } from "@/components/ui/form";
import { getInfoByService, translateText } from "@/lib/apiservice";
import { Api, Category, FormErrors, Service } from "@/types";
import { Download, Languages } from "lucide-react";

interface ServiceAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  apis: Api[];
  onAddService: (service: Omit<Service, "id" | "created_at" | "updated_at">) => Promise<void>;
}

export const ServiceAddDialog: React.FC<ServiceAddDialogProps> = ({ open, onOpenChange, categories, apis, onAddService }) => {
  const [newService, setNewService] = useState<Omit<Service, "id" | "created_at" | "updated_at">>({
    name_uz: "",
    name_ru: "",
    name_en: "",
    description_uz: "",
    description_ru: "",
    description_en: "",
    duration: 86400,
    min: 0,
    max: 0,
    price: 0,
    percent: 0,
    site_id: 0,
    category: categories[0]?.id || 0,
    api: apis[0]?.id || 0,
    is_active: true,
    auto_update: false,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [fetchingServiceInfo, setFetchingServiceInfo] = useState<boolean>(false);
  const [translating, setTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiFetched, setIsApiFetched] = useState<boolean>(false);

  useEffect(() => {
    if (newService.min > newService.max && newService.max !== 0) {
      setFormErrors((prev) => ({
        ...prev,
        min: "Min must be less than or equal to max",
        max: "Max must be greater than or equal to min",
      }));
    } else if (formErrors.min || formErrors.max) {
      setFormErrors((prev) => {
        const { min, max, ...rest } = prev;
        return rest;
      });
    }
  }, [newService.min, newService.max]);

  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem("service_draft");
        if (saved) {
          const parsed = JSON.parse(saved);
          setNewService((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
      }
    }
  }, [open]);

  useEffect(() => {
    const draft = {
      name_uz: newService.name_uz,
      name_ru: newService.name_ru,
      name_en: newService.name_en,
      description_uz: newService.description_uz,
      description_ru: newService.description_ru,
      description_en: newService.description_en,
    };
    try {
      localStorage.setItem("service_draft", JSON.stringify(draft));
    } catch {
      /* ignore storage errors */
    }
  }, [
    newService.name_uz,
    newService.name_ru,
    newService.name_en,
    newService.description_uz,
    newService.description_ru,
    newService.description_en,
  ]);

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    if (!newService.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!newService.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!newService.name_en) errors.name_en = "Name (English) is required";
    if (!newService.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!newService.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!newService.description_en) errors.description_en = "Description (English) is required";
    if (newService.price === undefined || newService.price === null || isNaN(newService.price) || newService.price < 0)
      errors.price = "Price must be 0 or greater";
    if (!newService.percent) errors.percentage = "Percentage is required";
    if (newService.min === undefined || newService.min === null || newService.min < 0)
      errors.min = "Min quantity must be 0 or greater";
    if (newService.max === undefined || newService.max === null || newService.max < 0)
      errors.max = "Max quantity must be 0 or greater";
    if (!newService.site_id) errors.site_id = "Site ID is required";
    if (!newService.api) errors.api = "API is required";
    if (!newService.category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newService]);

  const fetchServiceInfo = useCallback(async () => {
    if (!newService.site_id || !newService.api) {
      setError("Please select both Site ID and API");
      return;
    }
    
    try {
      setFetchingServiceInfo(true);
      setError(null);
      const serviceInfo = await getInfoByService(newService.site_id, newService.api);
      setNewService((prev) => ({
        ...prev,
        name_uz: serviceInfo.name_uz,
        name_ru: serviceInfo.name_ru,
        name_en: serviceInfo.name_en,
        min: serviceInfo.min_quantity,
        max: serviceInfo.max_quantity,
        price: serviceInfo.price,
        percent: serviceInfo.percent,
      }));
      setFormErrors((prev) => {
        const { min, max, price, percentage, name_en, ...rest } = prev;
        return rest;
      });
      setIsApiFetched(true);
    } catch (err) {
      setError((err as { message?: string }).message || "Failed to fetch service info");
      setIsApiFetched(false);
    } finally {
      setFetchingServiceInfo(false);
    }
  }, [newService.site_id, newService.api]);

  const handleTranslate = useCallback(async () => {
    if (!newService.description_en) {
      setError("Please enter English description first");
      return;
    }

    try {
      setTranslating(true);
      setError(null);
      const translated = await translateText(newService.description_en);
      setNewService((prev) => ({
        ...prev,
        description_en: translated.text,
        description_ru: translated.text_ru,
        description_uz: translated.text_uz,
      }));
      setFormErrors((prev) => {
        const { description_uz, description_ru, description_en, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setError((err as { message?: string }).message || "Failed to translate description");
    } finally {
      setTranslating(false);
    }
  }, [newService.description_en]);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await onAddService(newService);
      setNewService({
        name_uz: "",
        name_ru: "",
        name_en: "",
        description_uz: "",
        description_ru: "",
        description_en: "",
        duration: 86400,
        min: 0,
        max: 0,
        price: 0,
        percent: 0,
        site_id: 0,
        category: categories[0]?.id || 0,
        api: apis[0]?.id || 0,
        is_active: true,
        auto_update: false,
      });
      setFormErrors({});
      setError(null);
      setIsApiFetched(false);
      try { localStorage.removeItem("service_draft"); } catch {}
      onOpenChange(false);
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat qo'shishda xato yuz berdi");
    }
  };

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    const value = e.target.value;
    setNewService((prev) => ({
      ...prev,
      [field]: value === "" ? 0 : field === "percent" ? value : Number.parseFloat(value) || 0,
    }));
  };

  const handleNumberInputBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    field: keyof Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    if (e.target.value === "") {
      setNewService((prev) => ({ ...prev, [field]: field === "percent" ? "0" : 0 }));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Service"
      description="Create a new service for your customers."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={fetchingServiceInfo || translating}>
            {fetchingServiceInfo || translating ? "Processing..." : "Add Service"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 py-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="grid gap-2">
          <Label htmlFor="category">
            Category<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={newService.category.toString()}
            onValueChange={(value) => setNewService({ ...newService, category: Number.parseInt(value) })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.category && <FormMessage>{formErrors.category}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="site-id">
            Site ID<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="site-id"
            type="number"
            min="0"
            value={newService.site_id === 0 ? "" : newService.site_id}
            onChange={(e) => setNewService({ ...newService, site_id: Number.parseInt(e.target.value) || 0 })}
            onBlur={(e) => handleNumberInputBlur(e, "site_id")}
            required
            placeholder="Enter Site ID"
          />
          {formErrors.site_id && <FormMessage>{formErrors.site_id}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api">
            API<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={newService.api.toString()}
            onValueChange={(value) => setNewService({ ...newService, api: Number.parseInt(value) })}
          >
            <SelectTrigger id="api">
              <SelectValue placeholder="Select an API" />
            </SelectTrigger>
            <SelectContent>
              {apis.map((api) => (
                <SelectItem key={api.id} value={api.id.toString()}>
                  {api.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.api && <FormMessage>{formErrors.api}</FormMessage>}
        </div>

        <Button 
          onClick={fetchServiceInfo} 
          disabled={fetchingServiceInfo || !newService.site_id || !newService.api}
          className="w-full"
          variant="secondary"
        >
          <Download className="mr-2 h-4 w-4" />
          {fetchingServiceInfo ? "Loading..." : "Load Service Info"}
        </Button>

        <div className="grid gap-2">
          <Label htmlFor="name_uz">
            Name (Uzbek)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="name_uz"
            type="text"
            value={newService.name_uz}
            onChange={(e) => setNewService({ ...newService, name_uz: e.target.value })}
            required
          />
          {formErrors.name_uz && <FormMessage>{formErrors.name_uz}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name_ru">
            Name (Russian)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="name_ru"
            type="text"
            value={newService.name_ru}
            onChange={(e) => setNewService({ ...newService, name_ru: e.target.value })}
            required
          />
          {formErrors.name_ru && <FormMessage>{formErrors.name_ru}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name_en">
            Name (English)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="name_en"
            type="text"
            value={newService.name_en}
            onChange={(e) => setNewService({ ...newService, name_en: e.target.value })}
            required
          />
          {formErrors.name_en && <FormMessage>{formErrors.name_en}</FormMessage>}
        </div>

        <DurationInput
          value={newService.duration}
          onChange={(duration) => setNewService({ ...newService, duration })}
          label="Duration"
          error={formErrors.duration}
          required
        />

        <div className="grid gap-2">
          <Label htmlFor="description_uz">
            Description (Uzbek)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="description_uz"
            value={newService.description_uz}
            onChange={(e) => setNewService({ ...newService, description_uz: e.target.value })}
            required
          />
          {formErrors.description_uz && <FormMessage>{formErrors.description_uz}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description_ru">
            Description (Russian)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="description_ru"
            value={newService.description_ru}
            onChange={(e) => setNewService({ ...newService, description_ru: e.target.value })}
            required
          />
          {formErrors.description_ru && <FormMessage>{formErrors.description_ru}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description_en">
            Description (English)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="description_en"
            value={newService.description_en}
            onChange={(e) => setNewService({ ...newService, description_en: e.target.value })}
            required
          />
          {formErrors.description_en && <FormMessage>{formErrors.description_en}</FormMessage>}
        </div>

        <Button 
          onClick={handleTranslate} 
          disabled={translating || !newService.description_en}
          className="w-full"
          variant="secondary"
        >
          <Languages className="mr-2 h-4 w-4" />
          {translating ? "Translating..." : "Translate Description"}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="min">
              Min Quantity<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="min"
              type="number"
              min="0"
              value={newService.min === 0 ? "" : newService.min}
              onChange={(e) => handleNumberInputChange(e, "min")}
              onBlur={(e) => handleNumberInputBlur(e, "min")}
              required
            />
            {formErrors.min && <FormMessage>{formErrors.min}</FormMessage>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max">
              Max Quantity<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="max"
              type="number"
              min="0"
              value={newService.max === 0 ? "" : newService.max}
              onChange={(e) => handleNumberInputChange(e, "max")}
              onBlur={(e) => handleNumberInputBlur(e, "max")}
              required
            />
            {formErrors.max && <FormMessage>{formErrors.max}</FormMessage>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">
              Price ($)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={newService.price === 0 ? "" : newService.price}
              onChange={(e) => handleNumberInputChange(e, "price")}
              onBlur={(e) => handleNumberInputBlur(e, "price")}
              required
            />
            {formErrors.price && <FormMessage>{formErrors.price}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="percentage">
              Percentage (%)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newService.percent === 0 ? "" : newService.percent}
              onChange={(e) => handleNumberInputChange(e, "percent")}
              onBlur={(e) => handleNumberInputBlur(e, "percent")}
              required
            />
            {formErrors.percentage && <FormMessage>{formErrors.percentage}</FormMessage>}
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={newService.is_active}
              onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto_update">Auto Update</Label>
            <Switch
              id="auto_update"
              checked={newService.auto_update}
              onCheckedChange={(checked) => setNewService({ ...newService, auto_update: checked })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};