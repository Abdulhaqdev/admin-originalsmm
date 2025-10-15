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

interface ServiceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  categories: Category[];
  apis: Api[];
  onUpdateService: (service: Service) => Promise<void>;
}

export const ServiceEditDialog: React.FC<ServiceEditDialogProps> = ({
  open,
  onOpenChange,
  service,
  categories,
  apis,
  onUpdateService,
}) => {
  const [editService, setEditService] = useState<Service | null>(service);
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});
  const [fetchingServiceInfo, setFetchingServiceInfo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiFetched, setIsApiFetched] = useState<boolean>(false); // Track if API data has been fetched

  useEffect(() => {
    setEditService(service);
    setIsApiFetched(false); // Reset API fetch state when service changes
  }, [service]);

  useEffect(() => {
    if (!editService) return;
    if (editService.min > editService.max && editService.max !== 0) {
      setEditFormErrors((prev) => ({
        ...prev,
        min: "Min must be less than or equal to max",
        max: "Max must be greater than or equal to min",
      }));
    } else if (editFormErrors.min || editFormErrors.max) {
      setEditFormErrors((prev) => {
        const { min, max, ...rest } = prev;
        return rest;
      });
    }
  }, [editService?.min, editService?.max]);

  const validateEditForm = useCallback(() => {
    if (!editService) return false;
    const errors: FormErrors = {};
    if (!editService.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!editService.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!editService.name_en) errors.name_en = "Name (English) is required";
    if (!editService.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!editService.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!editService.description_en) errors.description_en = "Description (English) is required";
    if (editService.price === undefined || editService.price === null || isNaN(editService.price))
      errors.price = "Price is required or invalid";
    if (!editService.percentage) errors.percentage = "Percentage is required";
    else if (parseFloat(editService.percentage) < 0 || parseFloat(editService.percentage) > 100)
      errors.percentage = "Percentage must be between 0 and 100";
    if (editService.min === undefined || editService.min === null || editService.min < 0)
      errors.min = "Min quantity must be 0 or greater";
    if (editService.max === undefined || editService.max === null || editService.max < 0)
      errors.max = "Max quantity must be 0 or greater";
    if (!editService.site_id) errors.site_id = "Site ID is required";
    if (!editService.api) errors.api = "API is required";
    if (!editService.category) errors.category = "Category is required";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editService]);

  const handleApiChange = useCallback(
    async (apiId: string) => {
      if (!editService) return;
      const api_id = Number.parseInt(apiId);
      setEditService((prev) => prev && ({ ...prev, api: api_id }));

      if (editService.site_id && api_id) {
        try {
          setFetchingServiceInfo(true);
          setIsApiFetched(true); // Mark API data as fetched
          const serviceInfo = await getInfoByService(editService.site_id, api_id);
          setEditService((prev) => prev && ({
            ...prev,
            name_en: serviceInfo.name,
            min: serviceInfo.min_quantity,
            max: serviceInfo.max_quantity,
            price: serviceInfo.price,
            percentage: serviceInfo.percentage,
          }));
          setEditFormErrors((prev) => {
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
    [editService],
  );

  const handleSiteIdChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editService) return;
      const site_id = Number.parseInt(e.target.value) || 0;
      setEditService((prev) => prev && ({ ...prev, site_id }));

      if (editService.api && site_id) {
        try {
          setFetchingServiceInfo(true);
          setIsApiFetched(true); // Mark API data as fetched
          const serviceInfo = await getInfoByService(site_id, editService.api);
          setEditService((prev) => prev && ({
            ...prev,
            name_en: serviceInfo.name,
            min: serviceInfo.min_quantity,
            max: serviceInfo.max_quantity,
            price: serviceInfo.price,
            percentage: serviceInfo.percentage,
          }));
          setEditFormErrors((prev) => {
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
    [editService],
  );

  const handleSubmit = async () => {
    if (!editService || !validateEditForm()) return;
    try {
      await onUpdateService(editService);
      setEditFormErrors({});
      setError(null);
      setIsApiFetched(false);
      onOpenChange(false);
    } catch (err) {
      setError((err as { message?: string }).message || "Xizmat yangilashda xato yuz berdi");
    }
  };

  // Handle number input changes to prevent clearing 0
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Service,
  ) => {
    if (!editService) return;
    const value = e.target.value;
    setEditService((prev) => prev && ({
      ...prev,
      [field]: value === "" ? 0 : field === "percentage" ? value : Number.parseFloat(value) || 0,
    }));
  };

  // Handle blur to ensure 0 is set if input is empty
  const handleNumberInputBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    field: keyof Service,
  ) => {
    if (!editService) return;
    if (e.target.value === "") {
      setEditService((prev) => prev && ({ ...prev, [field]: 0 }));
    }
  };

  if (!editService) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Service"
      description="Update the service details."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={fetchingServiceInfo}>
            {fetchingServiceInfo ? "Fetching..." : "Update Service"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 py-4">
        {error && <div className="text-red-500">{error}</div>}
        <div className="grid gap-2">
          <Label htmlFor="edit-category">
            Category<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={editService.category.toString()}
            onValueChange={(value) => setEditService({ ...editService, category: Number.parseInt(value) })}
          >
            <SelectTrigger id="edit-category">
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
          {editFormErrors.category && <FormMessage>{editFormErrors.category}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-name_uz">
            Name (Uzbek)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="edit-name_uz"
            value={editService.name_uz}
            onChange={(e) => setEditService({ ...editService, name_uz: e.target.value })}
            required
          />
          {editFormErrors.name_uz && <FormMessage>{editFormErrors.name_uz}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-name_ru">
            Name (Russian)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="edit-name_ru"
            value={editService.name_ru}
            onChange={(e) => setEditService({ ...editService, name_ru: e.target.value })}
            required
          />
          {editFormErrors.name_ru && <FormMessage>{editFormErrors.name_ru}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-name_en">
            Name (English)<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="edit-name_en"
            value={editService.name_en}
            onChange={(e) => setEditService({ ...editService, name_en: e.target.value })}
            required
            disabled={isApiFetched}
          />
          {editFormErrors.name_en && <FormMessage>{editFormErrors.name_en}</FormMessage>}
        </div>

        <DurationInput
          value={editService.duration}
          onChange={(duration) => setEditService({ ...editService, duration })}
          label="Duration"
          error={editFormErrors.duration}
          required
        />

        <div className="grid gap-2">
          <Label htmlFor="edit-description_uz">
            Description (Uzbek)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="edit-description_uz"
            value={editService.description_uz}
            onChange={(e) => setEditService({ ...editService, description_uz: e.target.value })}
            required
          />
          {editFormErrors.description_uz && <FormMessage>{editFormErrors.description_uz}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-description_ru">
            Description (Russian)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="edit-description_ru"
            value={editService.description_ru}
            onChange={(e) => setEditService({ ...editService, description_ru: e.target.value })}
            required
          />
          {editFormErrors.description_ru && <FormMessage>{editFormErrors.description_ru}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-description_en">
            Description (English)<span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="edit-description_en"
            value={editService.description_en}
            onChange={(e) => setEditService({ ...editService, description_en: e.target.value })}
            required
          />
          {editFormErrors.description_en && <FormMessage>{editFormErrors.description_en}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-site-id">
            Site ID<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="edit-site-id"
            type="number"
            min="0"
            value={editService.site_id === 0 ? "" : editService.site_id}
            onChange={handleSiteIdChange}
            onBlur={(e) => handleNumberInputBlur(e, "site_id")}
            required
          />
          {editFormErrors.site_id && <FormMessage>{editFormErrors.site_id}</FormMessage>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-api">
            API<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={editService.api.toString()}
            onValueChange={handleApiChange}
            disabled={fetchingServiceInfo}
          >
            <SelectTrigger id="edit-api">
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
          {editFormErrors.api && <FormMessage>{editFormErrors.api}</FormMessage>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-min">
              Min Quantity<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="edit-min"
              type="number"
              min="0"
              value={editService.min === 0 ? "" : editService.min}
              onChange={(e) => handleNumberInputChange(e, "min")}
              onBlur={(e) => handleNumberInputBlur(e, "min")}
              required
            />
            {editFormErrors.min && <FormMessage>{editFormErrors.min}</FormMessage>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-max">
              Max Quantity<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="edit-max"
              type="number"
              min="0"
              value={editService.max === 0 ? "" : editService.max}
              onChange={(e) => handleNumberInputChange(e, "max")}
              onBlur={(e) => handleNumberInputBlur(e, "max")}
              required
            />
            {editFormErrors.max && <FormMessage>{editFormErrors.max}</FormMessage>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-price">
              Price ($)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="edit-price"
              type="number"
              min="0"
              step="0.01"
              value={editService.price === 0 ? "" : editService.price}
              onChange={(e) => handleNumberInputChange(e, "price")}
              onBlur={(e) => handleNumberInputBlur(e, "price")}
              required
            />
            {editFormErrors.price && <FormMessage>{editFormErrors.price}</FormMessage>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-percentage">
              Percentage (%)<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="edit-percentage"
              type="number"
              min="0"
              max="100"
              value={editService.percentage === "0" ? "" : editService.percentage}
              onChange={(e) => handleNumberInputChange(e, "percentage")}
              onBlur={(e) => handleNumberInputBlur(e, "percentage")}
              required
            />
            {editFormErrors.percentage && <FormMessage>{editFormErrors.percentage}</FormMessage>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="edit-is_active">Active</Label>
          <Switch
            id="edit-is_active"
            checked={editService.is_active}
            onCheckedChange={(checked) => setEditService({ ...editService, is_active: checked })}
          />
        </div>
      </div>
    </Modal>
  );
};