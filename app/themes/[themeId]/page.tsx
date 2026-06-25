import { getTheme } from "@/actions/themes";
import ThemeView from "@/components/theme-view";
import { Metadata } from "next";

interface ThemePageProps {
  params: Promise<{
    themeId: string;
  }>;
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const { themeId } = await params;
  const theme = await getTheme(themeId);

  return {
    title: theme?.name ? `${theme.name} - tweakcn` : "Theme - tweakcn",
    description: theme?.name
      ? `View the ${theme.name} shadcn/ui theme`
      : "Discover shadcn/ui themes",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { themeId } = await params;
  const theme = await getTheme(themeId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto px-4 py-8">
        <ThemeView theme={theme} />
      </div>
    </div>
  );
}

