
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Search, Send } from "lucide-react";
import { sampleVendors } from "@/data/sampleData";
import { useState } from "react";

const AgentMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // We'll use vendors as message contacts for this demo
  const contacts = sampleVendors.map(vendor => ({
    id: vendor.id,
    name: vendor.name,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name)}&background=random`,
    lastMessage: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    time: "2h ago",
    unread: vendor.id === "2" || vendor.id === "4", // Just for demo purposes
  }));
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // For demo purposes, let's just show one dummy conversation
  const messages = [
    {
      id: "1",
      sender: "user",
      text: "Hello, I need to discuss the latest contract draft.",
      time: "10:30 AM"
    },
    {
      id: "2",
      sender: "contact",
      text: "Hi there! I'd be happy to go over it with you. What specific parts did you want to discuss?",
      time: "10:32 AM"
    },
    {
      id: "3",
      sender: "user",
      text: "I'm concerned about the delivery timeline in section 3.2. Can we extend it by two weeks?",
      time: "10:35 AM"
    },
    {
      id: "4",
      sender: "contact",
      text: "I understand your concern. Let me check with our operations team to see if that adjustment is feasible. I should have an answer for you by tomorrow.",
      time: "10:40 AM"
    },
    {
      id: "5",
      sender: "user",
      text: "That would be great, thank you! Looking forward to your response.",
      time: "10:42 AM"
    }
  ];
  
  return (
    <AppLayout>
      <div className="animate-fade-in h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Communicate with vendors and partners</p>
          </div>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
        
        <Card className="h-[calc(100vh-12rem)]">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Inbox</CardTitle>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>Manage your conversations</CardDescription>
              <div className="mt-2 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden flex mt-4 p-0">
              <TabsContent value="all" className="flex flex-1 overflow-hidden m-0 border-0">
                <div className="w-1/3 border-r overflow-y-auto">
                  {filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer ${
                        contact.id === "1" ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar>
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-xs text-muted-foreground">{contact.time}</span>
                        </div>
                        <div className="text-sm truncate text-muted-foreground">
                          {contact.lastMessage}
                        </div>
                      </div>
                      {contact.unread && (
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="w-2/3 flex flex-col h-full">
                  <div className="p-3 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={contacts[0].avatar} />
                      <AvatarFallback>{contacts[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{contacts[0].name}</div>
                      <div className="text-xs text-muted-foreground">Last active: 5m ago</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}
                        >
                          <p>{message.text}</p>
                          <div 
                            className={`text-xs mt-1 ${
                              message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {message.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input placeholder="Type your message..." className="flex-1" />
                      <Button>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="unread" className="m-0">
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select "Unread" to view your unread messages</p>
                </div>
              </TabsContent>
              
              <TabsContent value="archived" className="m-0">
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select "Archived" to view your archived messages</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AgentMessages;
