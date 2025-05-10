
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type CreditTransaction = {
  id: string;
  user_id: string;
  session_id: string | null;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
};

const CreditHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(0);
  
  useEffect(() => {
    if (user) {
      fetchCreditHistory();
      fetchUserProfile();
    }
  }, [user]);
  
  const fetchCreditHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching credit history:", error);
      toast({
        title: "Error loading credit history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCreditBalance(data.credit_balance || 0);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    }
  };
  
  if (!user) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Please sign in</h3>
        <p className="text-gray-500">You need to be logged in to view your credit history.</p>
      </div>
    );
  }
  
  const formatAmount = (amount: number) => {
    return parseFloat(amount.toFixed(2));
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 mb-1">Current Balance</h3>
          <div className="text-3xl font-bold text-spark-dark">{formatAmount(creditBalance)}</div>
          <p className="text-xs text-gray-500 mt-2">
            Time credits can be earned by teaching and spent by learning
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 mb-1">Total Earned</h3>
          <div className="text-3xl font-bold text-green-600">
            {formatAmount(transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Credits earned from teaching sessions
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 mb-1">Total Spent</h3>
          <div className="text-3xl font-bold text-red-500">
            {formatAmount(Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Credits spent on learning sessions
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Transaction History</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-dark mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start teaching or learning to earn and spend credits
            </p>
          </div>
        ) : (
          <Table>
            <TableCaption>Your time credit transaction history</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        transaction.type === "earned" 
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-red-200 text-red-700 bg-red-50"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.amount > 0 ? "+" : ""}{formatAmount(transaction.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CreditHistory;
