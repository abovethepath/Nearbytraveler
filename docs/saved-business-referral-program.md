# Business Referral Program Section

This is the saved content for the Business Referral Program section that was temporarily removed from the profile page.

## Code Structure:

```jsx
{/* Business Referral Program Widget */}
{isOwnProfile && user && user.userType !== 'business' && (
  <Card 
    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
    onClick={() => setLocation('/referrals')}
  >
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Business Referral Program
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setLocation('/referrals');
          }}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white border-0"
        >
          <Edit className="w-3 h-3 mr-1" />
          Manage
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="bg-green-50 dark:bg-green-900 border-2 border-green-600 dark:border-green-500 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-200 text-lg font-bold text-center">
          💰 Earn $100 for Referring Businesses to Nearby Traveler!!*
        </p>
        <p className="text-green-600 dark:text-green-400 text-sm mt-2 text-center">
          Help fund your trips • Get deals from local hotspots • Earn extra income
        </p>
        <p className="text-green-600 dark:text-green-400 text-sm mt-1 text-center">
          Share your Favorite Businesses with others and help them market to Nearby Travelers and Nearby Locals
        </p>
        <p className="text-green-500 dark:text-green-500 text-xs mt-2 text-center italic">
          (* When a Business Becomes a Paying Client)
        </p>
      </div>
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-300 mb-2">Invite businesses to join Nearby Traveler and earn rewards when they subscribe!</p>
      </div>
    </CardContent>
  </Card>
)}
```

## Description:
- Visible only to non-business users on their own profile
- Click-to-navigate to `/referrals` page
- Green-themed design with monetary incentive messaging
- Includes manage button for easy access
- Contains referral program details and call-to-action

This can be re-integrated later when the referral program is ready to be featured.