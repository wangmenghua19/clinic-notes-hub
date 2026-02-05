import re
from typing import Tuple, List

PATIENT_NAME_PATTERNS = [
    r'患者[\u4e00-\u9fa5]{1,4}',  # 患者+中文名
    r'病人[\u4e00-\u9fa5]{1,4}',  # 病人+中文名
    r'[李王张刘陈杨赵黄周吴徐孙马胡郭何高林罗郑梁谢宋唐曹邓许冯韩曾彭萧蔡潘田董袁于余叶蒋杜苏魏程吕丁任沈徐姚卢傅钟姜崔谭陆汪范金石廖贾夏韦傅方孟邱贺白彭][\u4e00-\u9fa5]{1,2}', # 常见姓氏+名字
    r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', # 英文名
]

PRIVACY_KEYWORDS = [
    '姓名', '名字', '出生日期', '生日', '身份证号', '联系方式',
    '电话', '手机', '地址', '病历号', '就诊卡号', '医保卡号',
]

# 医学术语白名单，防止误判为人名
WHITELIST_TERMS = [
    '牙周', '牙周炎', '牙周病', '高血压', '糖尿病', '陈旧性', '白斑', '结石',
    '处方', '如何', '马牙', '林可霉素', '方丝弓', '方丝', '黄金', '黄疸'
]

class PrivacyDetector:
    RISK_HIGH = "high"
    RISK_MEDIUM = "medium"
    RISK_LOW = "low"

    @staticmethod
    def check_title(title: str) -> Tuple[str, List[str]]:
        """
        检查标题是否包含患者敏感信息
        返回: (风险等级, 警告信息列表)
        """
        alerts = []
        
        # 1. 关键字检测
        if '患者' in title or '病人' in title:
            alerts.append("标题包含'患者'或'病人'字样，建议使用编号替代真实姓名")
            # 不直接返回，继续检查其他特征，但标记为高风险
            if not alerts: # 如果还没添加过
                 alerts.append("标题包含'患者'或'病人'字样")

        if any(keyword in title for keyword in PRIVACY_KEYWORDS):
            alerts.append("标题可能包含个人身份信息关键字")

        # 2. 正则模式检测
        for pattern in PATIENT_NAME_PATTERNS:
            match = re.search(pattern, title)
            if match:
                # 检查是否在白名单中
                matched_text = match.group(0)
                is_safe = False
                for term in WHITELIST_TERMS:
                    if term in title: # 简单的包含检查，可以改进为位置重叠检查
                        # 如果匹配到的“名字”实际上是白名单词的一部分，或者包含了白名单词
                        if matched_text in term or term in matched_text: 
                            is_safe = True
                            break
                
                if not is_safe:
                    print(f"DEBUG: Matched '{matched_text}' in '{title}', not in whitelist")
                    alerts.append(f"标题可能包含真实姓名: {matched_text}")
                    break # 只要匹配到一个名字模式即可

        # 3. 数字敏感信息检测
        # 手机号 (11位数字，且通常以1开头)
        if re.search(r'1[3-9]\d{9}', title):
            alerts.append("标题可能包含手机号码")
        
        # 身份证 (18位数字，或17位数字+X)
        if re.search(r'\d{17}[\dX]', title):
            alerts.append("标题可能包含身份证号码")

        if alerts:
            return PrivacyDetector.RISK_HIGH, alerts
            
        return PrivacyDetector.RISK_LOW, alerts

    @staticmethod
    def check_content(content: str) -> Tuple[str, List[str]]:
        """
        检查内容是否包含患者敏感信息
        """
        alerts = []
        
        if not content:
            return PrivacyDetector.RISK_LOW, alerts

        ssn_pattern = r'\b\d{17}[\dX]\b'
        phone_pattern = r'\b1[3-9]\d{9}\b'
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

        if re.search(ssn_pattern, content):
            alerts.append("内容可能包含身份证号码")
            return PrivacyDetector.RISK_HIGH, alerts

        if re.search(phone_pattern, content):
            alerts.append("内容可能包含手机号码")
            return PrivacyDetector.RISK_MEDIUM, alerts

        if re.search(email_pattern, content):
            alerts.append("内容可能包含邮箱地址")
            return PrivacyDetector.RISK_MEDIUM, alerts

        return PrivacyDetector.RISK_LOW, alerts

    @staticmethod
    def suggest_anonymized_title(original_title: str) -> str:
        """
        生成脱敏后的标题建议
        """
        import hashlib
        import random
        
        # 生成一个短的随机ID或哈希
        hash_value = hashlib.md5(original_title.encode()).hexdigest()[:4].upper()
        
        # 简单的替换策略
        new_title = original_title
        
        # 尝试移除"患者"后面的名字 (假设名字长度为2-3)
        # 匹配 "患者张三" -> "患者_HASH"
        new_title = re.sub(r'(患者|病人)[\u4e00-\u9fa5]{1,3}', f'\\1_{hash_value}', new_title)
        
        # 尝试移除常见姓氏的名字
        # 这里比较激进，可能会误伤，但在建议中是可以接受的
        for pattern in PATIENT_NAME_PATTERNS[2:3]: # 只使用姓氏模式
             new_title = re.sub(pattern, f'患者_{hash_value}', new_title)

        # 手机号替换
        new_title = re.sub(r'1[3-9]\d{9}', '[手机号已屏蔽]', new_title)
        
        # 身份证替换
        new_title = re.sub(r'\d{17}[\dX]', '[身份证已屏蔽]', new_title)

        if new_title == original_title:
             # 如果正则没匹配到，但被判定为风险，直接暴力替换
             if '患者' in new_title:
                 return f"患者_{hash_value}_资料"
             return f"病例_{hash_value}_{original_title[:10]}..."

        return new_title
