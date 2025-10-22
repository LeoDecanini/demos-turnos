import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input"; // 🚀 usar parser
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

/** E.164 -> país (el “más largo” que matchee) */
function detectCountryFromE164(e164?: string): RPNInput.Country | undefined {
  if (!e164 || !e164.startsWith("+")) return undefined;
  const countries = RPNInput.getCountries();
  let best: { country: RPNInput.Country; code: string } | null = null;
  for (const c of countries) {
    const cc = RPNInput.getCountryCallingCode(c);
    const pref = `+${cc}`;
    if (e164.startsWith(pref)) {
      if (!best || pref.length > best.code.length) best = { country: c, code: pref };
    }
  }
  return best?.country;
}

/** 🚀 Si viene “local” (sin +), lo paso a E.164 usando el país actual */
function toE164IfLocal(val: string, country?: RPNInput.Country) {
  if (!val) return "";
  if (val.startsWith("+")) return val;
  try {
    if (!country) return val;
    const pn = parsePhoneNumber(val, country);
    return pn ? pn.number : val;
  } catch {
    return val;
  }
}

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, value, defaultCountry, ...props }, ref) => {
      const [country, setCountry] = React.useState<RPNInput.Country | undefined>(
        (defaultCountry as RPNInput.Country | undefined) ?? "AR"
      );

      // 🚀 Si el padre manda un value sin +, normalizalo a E.164 y “devolvéselo”
      React.useEffect(() => {
        if (typeof value === "string" && value && !value.startsWith("+")) {
          const e164: any = toE164IfLocal(value, country);
          if (e164 !== value) onChange?.(e164);
        }
      }, [value, country]); // eslint-disable-line react-hooks/exhaustive-deps

      // Autodetectá bandera cuando el usuario pega un +NN…
      React.useEffect(() => {
        if (typeof value === "string" && value.startsWith("+")) {
          const detected = detectCountryFromE164(value);
          if (detected && detected !== country) setCountry(detected);
        }
      }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

      return (
        <RPNInput.default
          ref={ref}
          className={cn("flex", className)}
          flagComponent={FlagComponent}
          countrySelectComponent={(selectProps) => (
            <CountrySelect
              value={country as RPNInput.Country}
              options={selectProps.options as CountryEntry[]}
              onChange={(c) => setCountry(c)}
            />
          )}
          inputComponent={(p) => (
            <Input
              {...p}
              // 🚀 ayuda a mobile y no rompe el formato del lib
              inputMode="tel"
              className={cn("rounded-e-lg rounded-s-none h-9", p.className)}
            />
          )}
          smartCaret={false}
          international // muestra “+54 9 11 …” con espacios
          country={country}
          defaultCountry={defaultCountry as RPNInput.Country | undefined}
          value={value || undefined}
          onChange={(val) => {
            // si el user escribe local sin +, convertirlo con el país actual
            const v = (val || "") as string;
            const next = v && !v.startsWith("+") ? toE164IfLocal(v, country) : v;

            // si pegó +NN…, actualizo bandera
            if (typeof next === "string" && next.startsWith("+")) {
              const detected = detectCountryFromE164(next);
              if (detected && detected !== country) setCountry(detected);
            }
            onChange?.((next || "") as RPNInput.Value);
          }}
          {...props}
        />
      );
    }
  );
PhoneInput.displayName = "PhoneInput";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({ value: selectedCountry, options: countryList, onChange }: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className="-mr-2 size-4 opacity-100" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                const vp = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
                if (vp) vp.scrollTop = 0;
              }, 0);
            }}
            placeholder="Buscar país…"
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No se encontró ningún país.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem className="gap-2" onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon className={cn("ml-auto size-4", country === selectedCountry ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
