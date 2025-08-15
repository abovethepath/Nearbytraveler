// COMPLETE BUSINESS PROFILE SAVE SOLUTION
// Copy this entire code block to replace the save functionality

// 1. FORM SCHEMA FOR BUSINESS USERS ONLY
const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  streetAddress: z.string().optional(),
  zipCode: z.string().optional(),
  bio: z.string().optional(),
  interests: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
  customInterests: z.string().optional(),
  customActivities: z.string().optional(),
  customEvents: z.string().optional(),
  // Hometown fields (required for save to work)
  hometownCity: z.string().optional(),
  hometownState: z.string().optional(),
  hometownCountry: z.string().optional(),
});

// 2. MUTATION FUNCTION (EXACT COPY)
const editProfile = useMutation({
  mutationFn: async (data) => {
    console.log('🔥 BUSINESS SAVE: Data being sent:', data);
    
    const response = await fetch(`/api/users/${effectiveUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id?.toString(),
        'x-user-type': 'business'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save error:', errorText);
      throw new Error(errorText);
    }
    
    return response.json();
  },
  onSuccess: (updatedUser) => {
    console.log('✅ BUSINESS SAVE SUCCESS:', updatedUser);
    
    // Update all caches
    queryClient.setQueryData([`/api/users/${effectiveUserId}`], updatedUser);
    queryClient.invalidateQueries({ queryKey: [`/api/users/${effectiveUserId}`] });
    
    // Update auth storage
    authStorage.setUser(updatedUser);
    if (typeof setAuthUser === 'function') {
      setAuthUser(updatedUser);
    }
    
    toast({
      title: "Profile updated",
      description: "Your business profile has been successfully updated.",
    });
    setIsEditMode(false);
  },
  onError: (error) => {
    console.error('Save failed:', error);
    toast({
      title: "Save failed",
      description: `Failed to save: ${error.message}`,
      variant: "destructive",
    });
  },
});

// 3. FORM INITIALIZATION (USE THIS)
const profileForm = useForm({
  resolver: zodResolver(businessProfileSchema),
  defaultValues: {
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    streetAddress: user?.streetAddress || '',
    zipCode: user?.zipCode || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    activities: user?.activities || [],
    events: user?.events || [],
    customInterests: user?.customInterests || '',
    customActivities: user?.customActivities || '',
    customEvents: user?.customEvents || '',
    hometownCity: user?.hometownCity || '',
    hometownState: user?.hometownState || '',
    hometownCountry: user?.hometownCountry || '',
  }
});

// 4. SUBMIT HANDLER (EXACT COPY)
const onSubmitProfile = (data) => {
  console.log('🔥 BUSINESS FORM SUBMIT:', data);
  console.log('🔥 Form errors:', profileForm.formState.errors);
  
  editProfile.mutate(data);
};

// 5. SAVE BUTTON HTML (EXACT COPY)
<Button 
  type="submit" 
  disabled={editProfile.isPending}
  className="flex-1"
  onClick={() => {
    console.log('🔥 SAVE BUTTON CLICKED');
    console.log('🔥 Form errors:', profileForm.formState.errors);
    console.log('🔥 Form values:', profileForm.getValues());
    console.log('🔥 Form valid:', profileForm.formState.isValid);
  }}
>
  {editProfile.isPending ? "Saving..." : "Save Changes"}
</Button>

// 6. FORM WRAPPER (EXACT COPY)
<Form {...profileForm}>
  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
    {/* ALL YOUR FORM FIELDS HERE */}
    
    {/* SAVE BUTTON AT BOTTOM */}
    <div className="flex gap-2 pt-4">
      <Button type="button" variant="outline" onClick={() => setIsEditMode(false)} className="flex-1">
        Cancel
      </Button>
      <Button type="submit" disabled={editProfile.isPending} className="flex-1">
        {editProfile.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </form>
</Form>

// 7. DEBUGGING TIPS
// - Open browser console (F12)
// - Click save button
// - Look for these logs:
//   🔥 SAVE BUTTON CLICKED
//   🔥 Form errors: (should be empty {})
//   🔥 BUSINESS FORM SUBMIT: (your data)
//   🔥 BUSINESS SAVE: Data being sent
//   ✅ BUSINESS SAVE SUCCESS

// 8. COMMON ISSUES & FIXES
// Issue: Form validation errors
// Fix: Check console for errors, ensure all required fields filled

// Issue: Network errors  
// Fix: Check browser Network tab for failed requests

// Issue: Schema conflicts
// Fix: Use businessProfileSchema only, not dynamic schema

// Issue: Missing headers
// Fix: Ensure x-user-id and x-user-type headers included

// 9. TEST THE SAVE
// 1. Fill in business name
// 2. Select business type from dropdown  
// 3. Fill in city/state/country
// 4. Click save
// 5. Check console for success/error logs