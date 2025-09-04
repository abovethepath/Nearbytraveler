import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Globe, Edit, Plus, Check, ChevronsUpDown } from "lucide-react";

const LANGUAGES_OPTIONS = [
  "Arabic", "Armenian", "Bengali", "Chinese (Mandarin)", "Chinese (Cantonese)", 
  "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Finnish", 
  "French", "German", "Greek", "Hebrew", "Hindi", "Hungarian", "Italian", 
  "Japanese", "Korean", "Latvian", "Lithuanian", "Norwegian", "Persian", 
  "Polish", "Portuguese", "Romanian", "Russian", "Serbian", "Slovak", 
  "Slovenian", "Spanish", "Swedish", "Thai", "Turkish", "Ukrainian", "Vietnamese"
];

interface LanguagesWidgetProps {
  user: any;
  isOwnProfile: boolean;
  editingLanguages: boolean;
  setEditingLanguages: (editing: boolean) => void;
  tempLanguages: string[];
  setTempLanguages: (languages: string[]) => void;
  customLanguageInput: string;
  setCustomLanguageInput: (input: string) => void;
  handleEditLanguages: () => void;
  handleSaveLanguages: () => void;
  handleCancelLanguages: () => void;
  updateLanguages: any;
}

export const LanguagesWidget: React.FC<LanguagesWidgetProps> = ({
  user,
  isOwnProfile,
  editingLanguages,
  setEditingLanguages,
  tempLanguages,
  setTempLanguages,
  customLanguageInput,
  setCustomLanguageInput,
  handleEditLanguages,
  handleSaveLanguages,
  handleCancelLanguages,
  updateLanguages
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Languages I Speak
          </CardTitle>
          {isOwnProfile && !editingLanguages && (
            <Button size="sm" variant="outline" onClick={handleEditLanguages} className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300">
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingLanguages ? (
          <div className="space-y-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-left"
                >
                  {tempLanguages.length > 0 
                    ? `${tempLanguages.length} language${tempLanguages.length > 1 ? 's' : ''} selected`
                    : "Select languages..."
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                <Command className="bg-white dark:bg-gray-800">
                  <CommandInput placeholder="Search languages..." className="border-0" />
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {LANGUAGES_OPTIONS.map((language) => (
                      <CommandItem
                        key={language}
                        value={language}
                        onSelect={() => {
                          const isSelected = tempLanguages.includes(language);
                          if (isSelected) {
                            setTempLanguages(tempLanguages.filter(l => l !== language));
                          } else {
                            setTempLanguages([...tempLanguages, language]);
                          }
                        }}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            tempLanguages.includes(language) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {language}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Custom Language Input */}
            <div className="mt-3">
              <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
                Add Custom Language (hit Enter after each)
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Sign Language, Mandarin"
                  value={customLanguageInput}
                  onChange={(e) => setCustomLanguageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = customLanguageInput.trim();
                      if (trimmed && !tempLanguages.includes(trimmed)) {
                        setTempLanguages([...tempLanguages, trimmed]);
                        setCustomLanguageInput('');
                      }
                    }
                  }}
                  className="text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const trimmed = customLanguageInput.trim();
                    if (trimmed && !tempLanguages.includes(trimmed)) {
                      setTempLanguages([...tempLanguages, trimmed]);
                      setCustomLanguageInput('');
                    }
                  }}
                  className="h-8 px-2"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Show selected languages */}
            {tempLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {tempLanguages.map((language) => (
                  <div key={language} className="inline-flex items-center justify-center h-6 rounded-full px-3 text-xs font-medium whitespace-nowrap leading-none bg-blue-500 text-white border-0">
                    {language}
                    <button
                      onClick={() => setTempLanguages(tempLanguages.filter(l => l !== language))}
                      className="ml-2 text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveLanguages} disabled={updateLanguages.isPending} className="bg-blue-600 hover:bg-blue-700">
                {updateLanguages.isPending ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelLanguages}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {user.languagesSpoken && user.languagesSpoken.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.languagesSpoken.map((language: string) => (
                  <div key={language} className="inline-flex items-center justify-center h-8 rounded-full px-4 text-xs font-medium leading-none whitespace-nowrap bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0 appearance-none select-none gap-1.5 shadow-md">
                    {language}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No languages listed</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};