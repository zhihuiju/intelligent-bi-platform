package com.yupi.springbootinit.model.dto.ai;

import lombok.Data;

/**
 * AI 对话请求
 *
 * *
 *  
 */
@Data
public class AiChatRequest {

    /**
     * 消息内容
     */
    private String message;

}
