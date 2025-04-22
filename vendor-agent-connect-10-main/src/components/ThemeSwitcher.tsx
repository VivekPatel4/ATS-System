import { Moon, Sun, Laptop, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { type Theme } from "@/contexts/ThemeContext";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: typeof Sun | typeof Moon | typeof Laptop | typeof Palette;
  color?: string;
  className?: string;
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themeOptions: ThemeOption[] = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      className: "text-yellow-500",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      className: "text-slate-900",
    },
    {
      value: "system",
      label: "System",
      icon: Laptop,
    },
  ];

  const colorOptions: ThemeOption[] = [
    {
      value: "blue",
      label: "Blue",
      icon: Palette,
      color: "bg-blue-500",
    },
    {
      value: "green",
      label: "Green",
      icon: Palette,
      color: "bg-green-500",
    },
    {
      value: "purple",
      label: "Purple",
      icon: Palette,
      color: "bg-purple-500",
    },
    {
      value: "rose",
      label: "Rose",
      icon: Palette,
      color: "bg-rose-500",
    },
    {
      value: "orange",
      label: "Orange",
      icon: Palette,
      color: "bg-orange-500",
    },
    {
      value: "yellow",
      label: "Yellow",
      icon: Palette,
      color: "bg-yellow-500",
    },
    {
      value: "cyan",
      label: "Cyan",
      icon: Palette,
      color: "bg-cyan-500",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="hover-lift theme-transition relative"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="font-semibold gradient-text">Pick a theme</span>
        </DropdownMenuLabel>
        {themeOptions.map(({ value, label, icon: Icon, className }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={`theme-transition hover-lift flex items-center justify-between ${
              theme === value ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${className || ""}`} />
              <span>{label}</span>
            </div>
            {theme === value && (
              <span className="text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">
          <span className="font-semibold gradient-text">Color themes</span>
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-2 p-2">
          {colorOptions.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`
                theme-transition hover-lift rounded-md p-2 flex flex-col items-center gap-1
                ${theme === value ? "ring-2 ring-primary" : ""}
              `}
            >
              <div className={`w-8 h-8 rounded-full ${color}`} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 