import servicesData from "@/data/services.json";
import type { ServiceInfo } from "@/types";

const services = servicesData as ServiceInfo[];

export function searchServices(query: string): ServiceInfo[] {
  const q = query.toLowerCase();
  return services.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.website.toLowerCase().includes(q)
  );
}

export function getServiceByName(name: string): ServiceInfo | undefined {
  const q = name.toLowerCase();
  return services.find((s) => s.name.toLowerCase() === q);
}

export function getServiceById(id: string): ServiceInfo | undefined {
  return services.find((s) => s.id === id);
}

export function getServicesByCategory(category: string): ServiceInfo[] {
  return services.filter(
    (s) => s.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllCategories(): string[] {
  const cats = new Set(services.map((s) => s.category));
  return Array.from(cats).sort();
}

export function getAllServices(): ServiceInfo[] {
  return services;
}
