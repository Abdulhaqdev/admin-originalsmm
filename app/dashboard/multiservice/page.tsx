"use client";

import React, { useEffect, useState } from "react";
import { Languages, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormMessage } from "@/components/ui/form";
import { DurationInput } from "@/components/ui/duration-input";
import { toast } from "@/hooks/use-toast";
import { apiClient, getApis, getCategories, translateText } from "@/lib/apiservice";
import { getErrorMessage } from "@/lib/error-utils";
import { Api, Category } from "@/types";

interface ServiceForm {
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  duration: number;
  min: number;
  max: number;
  price: number;
  percent: string;
  site_id: number;
  api: number;
  is_active: boolean;
}

interface DownloadedService {
  name: string;
  description: string;
  duration: number;
  min: number;
  max: number;
  price: number;
  site_id: number;
  category: number;
  api: number;
  percent: number;
}

export default function MultiServiceCreatePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedApi, setSelectedApi] = useState<number | "">("");
  const [downloadedServices, setDownloadedServices] = useState<DownloadedService[]>([]);
  const [services, setServices] = useState<ServiceForm[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: number]: { [key: string]: string } }>({});
  const [apis, setApis] = useState<Api[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [translatingNameIndex, setTranslatingNameIndex] = useState<number | null>(null);
  const [translatingDescriptionIndex, setTranslatingDescriptionIndex] = useState<number | null>(null);

  const getCategoryLabel = (category: Category) => {
    const names = [category.name_uz, category.name_ru, category.name_en].filter(Boolean);
    return names.length > 0 ? names.join(" / ") : `Category ${category.id}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, apisData] = await Promise.all([
          getCategories(100, 0),
          getApis(),
        ]);
        const normalizedCategories = categoriesData.results.map((cat) => ({
          ...cat,
          description_uz: cat.description_uz ?? "",
          description_ru: cat.description_ru ?? "",
          description_en: cat.description_en ?? "",
          icon: cat.icon ?? "",
        }));

        setCategories(normalizedCategories);
        setApis(apisData.results);
      } catch (err) {
        toast({
          title: "Xatolik",
          description: getErrorMessage(err, "Ma'lumotlarni yuklashda xato yuz berdi"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedCategory || !selectedApi) return;
      try {
        setFetchLoading(true);
        const response = await apiClient.post<DownloadedService[]>("/download-services/", {
          api: selectedApi,
          category: selectedCategory,
        });
        setDownloadedServices(response.data);
        setServices([]); // Clear existing forms when new services are fetched
        setFormErrors({});
      } catch (err) {
        toast({
          title: "Xatolik",
          description: getErrorMessage(err, "Xizmatlarni yuklashda xato yuz berdi"),
          variant: "destructive",
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory, selectedApi]);

  const addServiceForm = (service?: DownloadedService) => {
    const newService: ServiceForm = service
      ? {
          name_uz: "",
          name_ru: "",
          name_en: service.name || "",
          description_uz: "",
          description_ru: "",
          description_en: service.description || "",
          duration: service.duration || 0,
          min: service.min || 10,
          max: service.max || 1000,
          price: service.price ? service.price / 1000 : 0.65, // Convert to dollars
          percent: String(service.percent ?? 0),
          site_id: service.site_id || 0,
          api: Number(selectedApi),
          is_active: true,
        }
      : {
          name_uz: "",
          name_ru: "",
          name_en: "",
          description_uz: "",
          description_ru: "",
          description_en: "",
          duration: 0,
          min: 10,
          max: 1000,
          price: 0.65,
          percent: "0",
          site_id: 0,
          api: selectedApi ? Number(selectedApi) : apis[0]?.id || 0,
          is_active: true,
        };
    setServices([...services, newService]);
  };

  const handleServiceSelect = (value: string) => {
    setSelectedServiceId(value);
    const selectedService = downloadedServices[Number(value)];
    if (selectedService) {
      addServiceForm(selectedService);
    }
  };

  const removeServiceForm = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateServiceForm = (index: number, field: keyof ServiceForm, value: any) => {
    setServices((prev) =>
      prev.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    );
  };

  const validateForm = (index: number) => {
    const service = services[index];
    const errors: { [key: string]: string } = {};
    if (!service.name_uz) errors.name_uz = "Name (Uzbek) is required";
    if (!service.name_ru) errors.name_ru = "Name (Russian) is required";
    if (!service.name_en) errors.name_en = "Name (English) is required";
    if (!service.description_uz) errors.description_uz = "Description (Uzbek) is required";
    if (!service.description_ru) errors.description_ru = "Description (Russian) is required";
    if (!service.description_en) errors.description_en = "Description (English) is required";
    if (service.price === undefined || service.price === null || isNaN(service.price))
      errors.price = "Price is required";
    if (!service.percent) errors.percent = "Percentage is required";
    else if (parseFloat(service.percent) < 0 || parseFloat(service.percent) > 100)
      errors.percent = "Percentage must be between 0 and 100";
    if (service.duration === 0) errors.duration = "Duration is required";
    if (!service.min) errors.min = "Min quantity is required";
    if (!service.max) errors.max = "Max quantity is required";
    if (service.min > service.max && service.max !== 0) {
      errors.min = "Min must be less than max";
      errors.max = "Max must be greater than min";
    }
    if (!service.site_id) errors.site_id = "Site ID is required";
    if (!service.api) errors.api = "API is required";
    setFormErrors((prev) => ({ ...prev, [index]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    let isValid = true;
    services.forEach((_, index) => {
      if (!validateForm(index)) isValid = false;
    });
    if (!selectedCategory) {
      toast({
        title: "Xatolik",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    if (!selectedApi) {
      toast({
        title: "Xatolik",
        description: "Please select an API",
        variant: "destructive",
      });
      return;
    }
    if (!isValid) {
      toast({
        title: "Xatolik",
        description: "Please fix the errors in the forms",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        services: services.map((service) => ({
          ...service,
          category: Number(selectedCategory),
          api: Number(selectedApi),
        })),
      };
      await apiClient.post("/create-many-services/", payload);
      toast({
        title: "Muvaffaqiyatli",
        description: "All services created successfully!",
      });
      setServices([]);
      setFormErrors({});
      setSelectedServiceId("");
    } catch (err) {
      toast({
        title: "Xatolik",
        description: getErrorMessage(err, "Xizmatlarni yaratishda xato yuz berdi"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateName = async (index: number) => {
    const service = services[index];
    if (!service?.name_en) {
      setFormErrors((prev) => ({
        ...prev,
        [index]: {
          ...(prev[index] || {}),
          name_en: "Name (English) is required for translation",
        },
      }));
      return;
    }

    try {
      setTranslatingNameIndex(index);
      const translated = await translateText(service.name_en);
      setServices((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                name_en: translated.text || item.name_en,
                name_ru: translated.text_ru || item.name_ru,
                name_uz: translated.text_uz || item.name_uz,
              }
            : item,
        ),
      );
      setFormErrors((prev) => {
        const current = prev[index];
        if (!current) return prev;
        const { name_en, name_ru, name_uz, ...rest } = current;
        return {
          ...prev,
          [index]: rest,
        };
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description: getErrorMessage(err, "Nomni tarjima qilishda xato yuz berdi"),
        variant: "destructive",
      });
    } finally {
      setTranslatingNameIndex(null);
    }
  };

  const handleTranslateDescription = async (index: number) => {
    const service = services[index];
    if (!service?.description_en) {
      setFormErrors((prev) => ({
        ...prev,
        [index]: {
          ...(prev[index] || {}),
          description_en: "Description (English) is required for translation",
        },
      }));
      return;
    }

    try {
      setTranslatingDescriptionIndex(index);
      const translated = await translateText(service.description_en);
      setServices((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                description_en: translated.text || item.description_en,
                description_ru: translated.text_ru || item.description_ru,
                description_uz: translated.text_uz || item.description_uz,
              }
            : item,
        ),
      );
      setFormErrors((prev) => {
        const current = prev[index];
        if (!current) return prev;
        const { description_en, description_ru, description_uz, ...rest } = current;
        return {
          ...prev,
          [index]: rest,
        };
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description: getErrorMessage(err, "Tavsifni tarjima qilishda xato yuz berdi"),
        variant: "destructive",
      });
    } finally {
      setTranslatingDescriptionIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-10">
          <div className="mx-auto max-w-7xl flex items-center justify-center min-h-[90vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Create Multiple Services</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add Services</CardTitle>
              <CardDescription>Select a category and API to fetch services, then choose services to edit or add new ones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">
                      Category<span className="text-destructive ml-1">*</span>
                    </Label>
                    <Select
                      value={selectedCategory.toString()}
                      onValueChange={(value) => setSelectedCategory(value ? Number.parseInt(value) : "")}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {getCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="api">
                      API<span className="text-destructive ml-1">*</span>
                    </Label>
                    <Select
                      value={selectedApi.toString()}
                      onValueChange={(value) => setSelectedApi(value ? Number.parseInt(value) : "")}
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
                  </div>
                </div>

                {selectedCategory && selectedApi && (
                  <>
                    {fetchLoading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="service">
                            Select Service to Edit<span className="text-destructive ml-1">*</span>
                          </Label>
                          <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                            <SelectTrigger id="service">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {downloadedServices.map((service, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button onClick={() => addServiceForm()} className="w-fit">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Service Form
                        </Button>

                        {services.map((service, index) => (
                          <div key={index} className="border rounded-md p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold">Service {index + 1}</h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeServiceForm(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Service</span>
                              </Button>
                            </div>

                            <div className="grid gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`name_uz_${index}`}>
                                  Name (Uzbek)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                  id={`name_uz_${index}`}
                                  type="text"
                                  value={service.name_uz}
                                  onChange={(e) => updateServiceForm(index, "name_uz", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.name_uz && <FormMessage>{formErrors[index].name_uz}</FormMessage>}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`name_ru_${index}`}>
                                  Name (Russian)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                  id={`name_ru_${index}`}
                                  type="text"
                                  value={service.name_ru}
                                  onChange={(e) => updateServiceForm(index, "name_ru", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.name_ru && <FormMessage>{formErrors[index].name_ru}</FormMessage>}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`name_en_${index}`}>
                                  Name (English)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                  id={`name_en_${index}`}
                                  type="text"
                                  value={service.name_en}
                                  onChange={(e) => updateServiceForm(index, "name_en", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.name_en && <FormMessage>{formErrors[index].name_en}</FormMessage>}
                              </div>

                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleTranslateName(index)}
                                disabled={translatingNameIndex === index || !service.name_en}
                                className="w-fit"
                              >
                                <Languages className="mr-2 h-4 w-4" />
                                {translatingNameIndex === index ? "Translating..." : "Translate Name"}
                              </Button>

                              <DurationInput
                                value={service.duration}
                                onChange={(duration) => updateServiceForm(index, "duration", duration)}
                                label="Duration"
                                error={formErrors[index]?.duration}
                                required
                              />

                              <div className="grid gap-2">
                                <Label htmlFor={`description_uz_${index}`}>
                                  Description (Uzbek)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Textarea
                                  id={`description_uz_${index}`}
                                  value={service.description_uz}
                                  onChange={(e) => updateServiceForm(index, "description_uz", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.description_uz && <FormMessage>{formErrors[index].description_uz}</FormMessage>}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`description_ru_${index}`}>
                                  Description (Russian)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Textarea
                                  id={`description_ru_${index}`}
                                  value={service.description_ru}
                                  onChange={(e) => updateServiceForm(index, "description_ru", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.description_ru && <FormMessage>{formErrors[index].description_ru}</FormMessage>}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`description_en_${index}`}>
                                  Description (English)<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Textarea
                                  id={`description_en_${index}`}
                                  value={service.description_en}
                                  onChange={(e) => updateServiceForm(index, "description_en", e.target.value)}
                                  required
                                />
                                {formErrors[index]?.description_en && <FormMessage>{formErrors[index].description_en}</FormMessage>}
                              </div>

                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleTranslateDescription(index)}
                                disabled={translatingDescriptionIndex === index || !service.description_en}
                                className="w-fit"
                              >
                                <Languages className="mr-2 h-4 w-4" />
                                {translatingDescriptionIndex === index ? "Translating..." : "Translate Description"}
                              </Button>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor={`min_${index}`}>
                                    Min Quantity<span className="text-destructive ml-1">*</span>
                                  </Label>
                                  <Input
                                    id={`min_${index}`}
                                    type="number"
                                    value={service.min}
                                    onChange={(e) => updateServiceForm(index, "min", Number.parseInt(e.target.value) || 0)}
                                    required
                                  />
                                  {formErrors[index]?.min && <FormMessage>{formErrors[index].min}</FormMessage>}
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor={`max_${index}`}>
                                    Max Quantity<span className="text-destructive ml-1">*</span>
                                  </Label>
                                  <Input
                                    id={`max_${index}`}
                                    type="number"
                                    value={service.max}
                                    onChange={(e) => updateServiceForm(index, "max", Number.parseInt(e.target.value) || 0)}
                                    required
                                  />
                                  {formErrors[index]?.max && <FormMessage>{formErrors[index].max}</FormMessage>}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor={`price_${index}`}>
                                    Price ($)<span className="text-destructive ml-1">*</span>
                                  </Label>
                                  <Input
                                    id={`price_${index}`}
                                    type="number"
                                    step="0.01"
                                    value={service.price}
                                    onChange={(e) => updateServiceForm(index, "price", Number.parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                  {formErrors[index]?.price && <FormMessage>{formErrors[index].price}</FormMessage>}
                                </div>

                                <div className="grid gap-2">
                                  <Label htmlFor={`percentage_${index}`}>
                                    Percentage (%)<span className="text-destructive ml-1">*</span>
                                  </Label>
                                  <Input
                                    id={`percentage_${index}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={service.percent}
                                    onChange={(e) => updateServiceForm(index, "percent", e.target.value)}
                                    required
                                  />
                                  {formErrors[index]?.percent && <FormMessage>{formErrors[index].percentage}</FormMessage>}
                                </div>
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`site_id_${index}`}>
                                  Site ID<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                  id={`site_id_${index}`}
                                  type="number"
                                  value={service.site_id}
                                  onChange={(e) => updateServiceForm(index, "site_id", Number.parseInt(e.target.value) || 0)}
                                  required
                                />
                                {formErrors[index]?.site_id && <FormMessage>{formErrors[index].site_id}</FormMessage>}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor={`api_${index}`}>
                                  API<span className="text-destructive ml-1">*</span>
                                </Label>
                                <Select
                                  value={service.api.toString()}
                                  onValueChange={(value) => updateServiceForm(index, "api", Number.parseInt(value))}
                                >
                                  <SelectTrigger id={`api_${index}`}>
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
                                {formErrors[index]?.api && <FormMessage>{formErrors[index].api}</FormMessage>}
                              </div>

                              <div className="flex items-center gap-2">
                                <Label htmlFor={`is_active_${index}`}>Active</Label>
                                <Switch
                                  id={`is_active_${index}`}
                                  checked={service.is_active}
                                  onCheckedChange={(checked) => updateServiceForm(index, "is_active", checked)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {services.length > 0 && (
                          <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                                Creating...
                              </div>
                            ) : (
                              "Create All Services"
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
