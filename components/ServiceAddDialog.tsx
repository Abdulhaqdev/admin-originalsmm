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
import { getInfoByService } from "@/lib/apiservice";
import { Api, Category, FormErrors, Service } from "@/types";

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
    percentage: "50",
    site_id: 0,
    category: categories[0]?.id || 0,
    api: apis[0]?.id || 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [fetchingServiceInfo, setFetchingServiceInfo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiFetched, setIsApiFetched] = useState<boolean>(false); // Track if API data has been fetched

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

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    if (!newService.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!newService.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!newService.name_en) errors.name_en = "Name (English) is required";
    if (!newService.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!newService.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!newService.description_en) errors.description_en = "Description (English) is required";
    if (newService.price === undefined || newService.price === null || isNaN(newService.price))
      errors.price = "Price is required or invalid";
    if (!newService.percentage) errors.percentage = "Percentage is required";
    else if (parseFloat(newService.percentage) < 0 || parseFloat(newService.percentage) > 100)
      errors.percentage = "Percentage must be between 0 and 100";
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

  const handleApiChange = useCallback(
    async (apiId: string) => {
      const api_id = Number.parseInt(apiId);
      setNewService((prev) => ({ ...prev, api: api_id }));

      if (newService.site_id && api_id) {
        try {
          setFetchingServiceInfo(true);
          setIsApiFetched(true); // Mark API data as fetched
          const serviceInfo = await getInfoByService(newService.site_id, api_id);
          setNewService((prev) => ({
            ...prev,
            name_en: serviceInfo.name,
            min: serviceInfo.min_quantity,
            max: serviceInfo.max_quantity,
            price: serviceInfo.price,
            percentage: serviceInfo.percentage,
          }));
          setFormErrors((prev) => {
            const { min, max, price, percentage, name_en, ...rest } = prev;
            return rest;
          });
        } catch (err) {
          setError((err as { message?: string }).message || "Failed to fetch service info");
          setIsApiFetched(false); // Reset if fetch fails
        } finally {
          setFetchingServiceInfo(false);
        }
      } else {
        setIsApiFetched(false); // Reset if no valid site_id or api_id
      }
    },
    [newService.site_id],
  );

  const handleSiteIdChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const site_id = Number.parseInt(e.target.value) || 0;
      setNewService((prev) => ({ ...prev, site_id }));
      if (newService.api && site_id) {
        try {
          setFetchingServiceInfo(true);
          setIsApiFetched(true); // Mark API data as fetched
          const serviceInfo = await getInfoByService(site_id, newService.api);
          setNewService((prev) => ({
            ...prev,
            name_en: serviceInfo.name,
            min: serviceInfo.min_quantity,
            max: serviceInfo.max_quantity,
            price: serviceInfo.price,
            percentage: serviceInfo.percentage,
          }));
          setFormErrors((prev) => {
            const { min, max, price, percentage, name_en, ...rest } = prev;
            return rest;
          });
        } catch (err) {
          setError((err as { message?: string }).message || "Failed to fetch service info");
          setIsApiFetched(false); // Reset if fetch fails
        } finally {
          setFetchingServiceInfo(false);
        }
      } else {
        setIsApiFetched(false); // Reset if no valid site_id or api_id
      }
    },
    [newService.api],
  );

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
        percentage: "50",
        site_id: 0,
        category: categories[0]?.id || 0,
        api: apis[0]?.id || 0,
        is_active: true,
      });
      setFormErrors({});
      setError(null);
      setIsApiFetched(false);
      onOpenChange(false);
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat qo'shishda xato yuz berdi");
    }
  };

  // Handle number input changes to prevent clearing 0
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    const value = e.target.value;
    // Allow empty string during typing, but convert to 0 if empty on blur
    setNewService((prev) => ({
      ...prev,
      [field]: value === "" ? 0 : field === "percentage" ? value : Number.parseFloat(value) || 0,
    }));
  };

  // Handle blur to ensure 0 is set if input is empty
  const handleNumberInputBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    field: keyof Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    if (e.target.value === "") {
      setNewService((prev) => ({ ...prev, [field]: 0 }));
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
          <Button onClick={handleSubmit} disabled={fetchingServiceInfo}>
            {fetchingServiceInfo ? "Fetching..." : "Add Service"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 py-4">
        {error && <div className="text-red-500">{error}</div>}
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

        <div className="grid gap-2">
          <Label htmlFor="site-id">
            Site ID<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="site-id"
            type="number"
            min="0"
            value={newService.site_id === 0 ? "" : newService.site_id}
            onChange={handleSiteIdChange}
            onBlur={(e) => handleNumberInputBlur(e, "site_id")}
            required
            disabled={fetchingServiceInfo}
          />
          {formErrors.site_id && <FormMessage>{formErrors.site_id}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api">
            API<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={newService.api.toString()}
            onValueChange={handleApiChange}
            disabled={fetchingServiceInfo}
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
              value={newService.percentage === "0" ? "" : newService.percentage}
              onChange={(e) => handleNumberInputChange(e, "percentage")}
              onBlur={(e) => handleNumberInputBlur(e, "percentage")}
              required
            />
            {formErrors.percentage && <FormMessage>{formErrors.percentage}</FormMessage>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={newService.is_active}
            onCheckedChange={(checked) => setNewService({ ...newService, is_active: checked })}
          />
        </div>
      </div>
    </Modal>
  );
};