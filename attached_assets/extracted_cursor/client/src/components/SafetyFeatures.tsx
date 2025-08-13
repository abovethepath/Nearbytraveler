import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Phone, MapPin, Clock, AlertTriangle, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface SafetyTip {
  id: number;
  category: 'meeting' | 'hosting' | 'traveling' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function SafetyFeatures({ isOwnProfile = false }: { isOwnProfile?: boolean }) {
  const { user } = useAuth();
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: [`/api/emergency-contacts/${user?.id}`],
    enabled: !!user?.id && isOwnProfile
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: typeof newContact) => {
      return apiRequest(`/api/emergency-contacts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emergency-contacts/${user?.id}`] });
      setShowAddContact(false);
      setNewContact({ name: '', phone: '', relationship: '', isPrimary: false });
      toast({
        title: "Emergency contact added",
        description: "Your emergency contact has been saved securely",
      });
    },
  });

  const safetyTips: SafetyTip[] = [
    {
      id: 1,
      category: 'meeting',
      title: 'First Meetings in Public',
      description: 'Always meet new connections in public places like cafes, restaurants, or busy tourist areas.',
      priority: 'high'
    },
    {
      id: 2,
      category: 'hosting',
      title: 'Share Your Plans',
      description: 'Let trusted friends or family know where you\'re staying and who you\'re meeting.',
      priority: 'high'
    },
    {
      id: 3,
      category: 'traveling',
      title: 'Trust Your Instincts',
      description: 'If something feels off, don\'t hesitate to change plans or leave the situation.',
      priority: 'high'
    },
    {
      id: 4,
      category: 'general',
      title: 'Verify Profiles',
      description: 'Look for verified accounts, references, and complete profiles before connecting.',
      priority: 'medium'
    },
    {
      id: 5,
      category: 'meeting',
      title: 'Stay Connected',
      description: 'Keep your phone charged and maintain regular contact with trusted contacts.',
      priority: 'medium'
    },
    {
      id: 6,
      category: 'hosting',
      title: 'Know Local Emergency Numbers',
      description: 'Research local emergency services and keep important numbers handy.',
      priority: 'medium'
    }
  ];

  const communityGuidelines = [
    {
      title: 'Respect and Courtesy',
      description: 'Treat all community members with respect, regardless of their background, beliefs, or travel style.',
      icon: Users
    },
    {
      title: 'Honest Communication',
      description: 'Be honest about your expectations, limitations, and any changes to plans.',
      icon: MessageSquare
    },
    {
      title: 'Cultural Sensitivity',
      description: 'Be mindful of local customs, traditions, and cultural differences in every destination.',
      icon: MapPin
    },
    {
      title: 'Timely Responses',
      description: 'Respond to messages and requests promptly to maintain good community standing.',
      icon: Clock
    },
    {
      title: 'Safety First',
      description: 'Prioritize your safety and the safety of others in all interactions and activities.',
      icon: Shield
    },
    {
      title: 'Leave No Trace',
      description: 'Respect places and spaces, leaving them better than you found them.',
      icon: CheckCircle
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return Users;
      case 'hosting': return MapPin;
      case 'traveling': return Phone;
      case 'general': return Shield;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Contacts - Only for own profile */}
      {isOwnProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
              <Button
                onClick={() => setShowAddContact(!showAddContact)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
              >
                {showAddContact ? 'Cancel' : 'Add Contact'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Emergency contacts are kept private and secure. They can be shared with authorities if needed.
              </AlertDescription>
            </Alert>

            {showAddContact && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold">Add Emergency Contact</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Relationship</label>
                  <Input
                    value={newContact.relationship}
                    onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Parent, Sibling, Friend"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isPrimary" className="text-sm">
                    Primary emergency contact
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => addContactMutation.mutate(newContact)}
                    disabled={addContactMutation.isPending || !newContact.name || !newContact.phone}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
                  </Button>
                  <Button
                    onClick={() => setShowAddContact(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {emergencyContacts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No emergency contacts added</p>
                <p className="text-sm">Add trusted contacts for your safety while traveling</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyContacts.map((contact: EmergencyContact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {contact.name}
                          {contact.isPrimary && (
                            <Badge className="bg-red-100 text-red-800">Primary</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.relationship} • {contact.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Tips & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {safetyTips.map((tip) => {
              const IconComponent = getCategoryIcon(tip.category);
              return (
                <div key={tip.id} className={`p-4 border rounded-lg ${getPriorityColor(tip.priority)}`}>
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{tip.title}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {tip.category}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(tip.priority)}`}>
                          {tip.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm">{tip.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our community thrives on mutual respect, trust, and shared responsibility. 
              Following these guidelines helps create positive experiences for everyone.
            </p>
            
            <div className="grid gap-4">
              {communityGuidelines.map((guideline, index) => {
                const IconComponent = guideline.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{guideline.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {guideline.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200">
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                  🚨 Universal Emergency
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  If you're in immediate danger, call local emergency services immediately.
                  Most countries use 911, 112, or 999.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                  🏛️ Embassy/Consulate
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Contact your country's embassy or consulate for assistance with 
                  lost documents, legal issues, or other emergencies abroad.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200">
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  🏥 Medical Emergency
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Know your travel insurance details and carry emergency medical 
                  information including allergies and medications.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                  📞 Report Safety Issues
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Report any safety concerns or inappropriate behavior within 
                  the NearbyTraveler community to our safety team.
                </p>
              </div>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Remember:</strong> Your safety is the top priority. Trust your instincts, 
                stay aware of your surroundings, and don't hesitate to seek help when needed.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}