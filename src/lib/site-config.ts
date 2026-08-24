export type PublicSiteConfig = {
  contactEmail: string;
  contactPhone: string;
  businessName: string;
  businessStreet: string;
  businessPostalCode: string;
  businessCity: string;
  businessNip: string;
  businessRegon: string;
};

const requirePublicEnvironmentVariable = (name: string, value: string | undefined): string => {
  if (value == null || value.trim() === "") {
    throw new Error(`Brak wymaganej zmiennej środowiskowej: ${name}.`);
  }

  return value.trim();
};

const validateEmail = (email: string): void => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("VITE_CONTACT_EMAIL musi być poprawnym adresem e-mail.");
  }
};

const validatePhone = (phone: string): void => {
  if (!/^\+?[0-9][0-9\s()-]{5,}$/.test(phone)) {
    throw new Error("VITE_CONTACT_PHONE musi być poprawnym numerem telefonu.");
  }
};

export const getPublicSiteConfig = (): PublicSiteConfig => {
  const contactEmail = requirePublicEnvironmentVariable(
    "VITE_CONTACT_EMAIL",
    import.meta.env["VITE_CONTACT_EMAIL"],
  );
  const contactPhone = requirePublicEnvironmentVariable(
    "VITE_CONTACT_PHONE",
    import.meta.env["VITE_CONTACT_PHONE"],
  );

  validateEmail(contactEmail);
  validatePhone(contactPhone);

  return {
    contactEmail,
    contactPhone,
    businessName: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_NAME",
      import.meta.env["VITE_BUSINESS_NAME"],
    ),
    businessStreet: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_STREET",
      import.meta.env["VITE_BUSINESS_STREET"],
    ),
    businessPostalCode: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_POSTAL_CODE",
      import.meta.env["VITE_BUSINESS_POSTAL_CODE"],
    ),
    businessCity: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_CITY",
      import.meta.env["VITE_BUSINESS_CITY"],
    ),
    businessNip: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_NIP",
      import.meta.env["VITE_BUSINESS_NIP"],
    ),
    businessRegon: requirePublicEnvironmentVariable(
      "VITE_BUSINESS_REGON",
      import.meta.env["VITE_BUSINESS_REGON"],
    ),
  };
};
