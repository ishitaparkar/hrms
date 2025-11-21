from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').lower()
        user = request.user
        
        response_text = "I'm not sure about that. Please contact HR at hr@university.edu."

        # --- RULE BASED LOGIC ---
        
        # 1. Greetings
        if any(word in user_message for word in ['hi', 'hello', 'hey']):
            response_text = f"Hello {user.first_name}! How can I assist you with HR matters today?"

        # 2. Leave / Vacation
        elif 'leave' in user_message or 'vacation' in user_message or 'sick' in user_message:
            response_text = "To apply for leave, go to 'My Space' > 'Leaves' in the sidebar and click 'Apply Leave'. You can also check your balance there."

        # 3. Salary / Payroll
        elif 'salary' in user_message or 'payslip' in user_message or 'pay' in user_message:
            response_text = "You can view and download your payslips under 'My Space' > 'Payroll'. Payslips are usually generated on the 28th of every month."

        # 4. Profile / Photo
        elif 'photo' in user_message or 'profile' in user_message or 'picture' in user_message:
            response_text = "You can update your profile picture in 'My Space' > 'Profile'. Click the camera icon on your avatar."

        # 5. Resignation
        elif 'resign' in user_message:
            response_text = "Resignation requests can be submitted via the 'Resignation' tab in the sidebar. Please ensure you discuss this with your manager first."

        # 6. Attendance
        elif 'attendance' in user_message or 'clock' in user_message:
            response_text = "Your daily attendance is tracked automatically. You can view your history in 'My Space' > 'Attendance'."
            
        # 7. Policy
        elif 'policy' in user_message or 'handbook' in user_message:
             response_text = "You can find the Employee Handbook in 'Company News' or the 'Documents' section of your profile."

        return Response({'response': response_text}, status=status.HTTP_200_OK)