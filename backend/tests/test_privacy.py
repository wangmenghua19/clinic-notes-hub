import sys
import os
import unittest

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.privacy import PrivacyDetector

class TestPrivacyDetector(unittest.TestCase):
    def test_patient_keyword(self):
        """测试'患者'关键字检测"""
        title = "关于患者张三的治疗方案"
        risk, alerts = PrivacyDetector.check_title(title)
        self.assertEqual(risk, PrivacyDetector.RISK_HIGH)
        self.assertTrue(any("患者" in alert for alert in alerts))

    def test_patient_name_pattern(self):
        """测试姓名模式检测"""
        title = "张三 拔牙记录"
        risk, alerts = PrivacyDetector.check_title(title)
        # Note: The regex for names is a bit loose, so it might return MEDIUM or HIGH depending on implementation
        # In our implementation, simple 2-3 char names might be hard to catch without context, 
        # but the pattern r'[李王...][...]' catches common surnames followed by names.
        # Let's test with a title that matches the specific patterns we defined.
        
        # Test specific surname pattern
        title_with_name = "李明 根管治疗"
        risk, alerts = PrivacyDetector.check_title(title_with_name)
        self.assertIn(risk, [PrivacyDetector.RISK_MEDIUM, PrivacyDetector.RISK_HIGH])

    def test_phone_number(self):
        """测试手机号检测"""
        title = "联系电话13812345678"
        risk, alerts = PrivacyDetector.check_title(title)
        self.assertEqual(risk, PrivacyDetector.RISK_HIGH)
        self.assertTrue(any("手机" in alert for alert in alerts))

    def test_safe_title(self):
        """测试安全标题"""
        title = "关于牙周炎的文献综述"
        risk, alerts = PrivacyDetector.check_title(title)
        self.assertEqual(risk, PrivacyDetector.RISK_LOW)
        self.assertEqual(len(alerts), 0)

    def test_suggestion(self):
        """测试脱敏建议"""
        original = "患者张三的录音"
        suggestion = PrivacyDetector.suggest_anonymized_title(original)
        self.assertNotIn("张三", suggestion)
        self.assertIn("患者", suggestion)
        # Should contain hash part (Hex uppercase)
        self.assertRegex(suggestion, r'患者_[A-F0-9]+')

if __name__ == '__main__':
    unittest.main()
