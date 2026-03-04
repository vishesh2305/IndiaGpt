"use client";

import { useSession } from "next-auth/react";
import { useLanguageStore } from "@/store/language-store";
import { LANGUAGES } from "@/config/languages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Globe,
  MapPin,
  Mic,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Volume2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { selectedLanguage } = useLanguageStore();

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);

  const settingSections = [
    {
      title: "Language",
      description: "Change the language IndiaGPT responds in",
      icon: Globe,
      href: "/settings/language",
      value: currentLang?.nativeName || "English",
    },
    {
      title: "Profile",
      description: "Manage your account information",
      icon: User,
      href: "/settings/profile",
      value: session?.user?.name || "User",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground mb-6">
          Manage your IndiaGPT preferences
        </p>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-lg">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {session?.user?.name || "User"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {session?.user?.email || ""}
              </p>
            </div>
            <Link href="/settings/profile">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {settingSections.map((section, i) => (
              <Link key={section.title} href={section.href}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-saffron-50 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-saffron" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {section.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {section.value}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {i < settingSections.length - 1 && <Separator />}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Toggle Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Voice & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-india-green-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-india-green" />
                </div>
                <div>
                  <Label className="font-medium">Location Services</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable location for contextual responses
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-navy-light flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-navy" />
                </div>
                <div>
                  <Label className="font-medium">Auto Text-to-Speech</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically read AI responses aloud
                  </p>
                </div>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-saffron-50 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-saffron" />
                </div>
                <div>
                  <Label className="font-medium">Continuous Listening</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep microphone on in voice mode
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mb-20 md:mb-6">
          <CardContent className="p-6">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
