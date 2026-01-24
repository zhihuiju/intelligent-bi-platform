package com.yupi.springbootinit.controller;

import com.yupi.springbootinit.api.OpenAiApi;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.exception.BusinessException;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.model.dto.ai.AiChatRequest;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI 对话控制器
 *
 * *
 *  
 */
@RestController
@RequestMapping("/ai/chat")
@Slf4j
public class AiChatController {

    @Resource
    private OpenAiApi openAiApi;

    @Resource
    private UserService userService;

    // 对话记忆缓存，使用 ConcurrentHashMap 保证线程安全
    private final Map<Long, List<Map<String, String>>> chatMemoryMap = new ConcurrentHashMap<>();

    /**
     * AI 对话
     *
     * @param aiChatRequest AI 对话请求
     * @param request       HttpServletRequest
     * @return 对话响应
     */
    @PostMapping
    public BaseResponse<String> aiChat(@RequestBody AiChatRequest aiChatRequest, HttpServletRequest request) {
        if (aiChatRequest == null || StringUtils.isBlank(aiChatRequest.getMessage())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "消息不能为空");
        }

        User loginUser = userService.getLoginUser(request);
        Long userId = loginUser.getId();
        String message = aiChatRequest.getMessage();

        // 获取用户的对话记忆
        List<Map<String, String>> chatMemory = chatMemoryMap.computeIfAbsent(userId, k -> new ArrayList<>());

        // 添加用户消息到对话记忆
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", message);
        chatMemory.add(userMessage);

        // 构建完整的对话历史
        StringBuilder conversation = new StringBuilder();
        conversation.append("你是一个智能助手，名叫小Q，善于回答各种问题，帮助用户解决问题。\n\n");
        
        for (Map<String, String> msg : chatMemory) {
            if ("user".equals(msg.get("role"))) {
                conversation.append("用户：").append(msg.get("content")).append("\n");
            } else {
                conversation.append("小Q：").append(msg.get("content")).append("\n");
            }
        }

        // 调用 AI 接口
        String response = openAiApi.doChat(conversation.toString());

        // 解析 AI 响应
        String aiResponse = parseAiResponse(response);

        // 添加 AI 响应到对话记忆
        Map<String, String> aiMessage = new HashMap<>();
        aiMessage.put("role", "assistant");
        aiMessage.put("content", aiResponse);
        chatMemory.add(aiMessage);

        // 限制对话记忆长度，最多保存 20 条消息
        if (chatMemory.size() > 20) {
            chatMemory.subList(0, chatMemory.size() - 20).clear();
        }

        return ResultUtils.success(aiResponse);
    }

    /**
     * 清空对话记忆
     *
     * @param request HttpServletRequest
     * @return 是否成功
     */
    @PostMapping("/clear")
    public BaseResponse<Boolean> clearChatMemory(HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        Long userId = loginUser.getId();

        chatMemoryMap.remove(userId);
        return ResultUtils.success(true);
    }

    /**
     * 解析 AI 响应
     *
     * @param response AI 接口响应
     * @return 解析后的响应内容
     */
    private String parseAiResponse(String response) {
        try {
            // 简单解析 JSON 响应，提取 content 字段
            // 这里使用简单的字符串处理，实际项目中建议使用 JSON 解析库
            int contentStart = response.indexOf("\"content\":\"");
            if (contentStart == -1) {
                return "抱歉，我没有理解你的问题，请尝试重新表述。";
            }
            contentStart += "\"content\":\"" .length();
            int contentEnd = response.indexOf("\"", contentStart);
            if (contentEnd == -1) {
                return "抱歉，我没有理解你的问题，请尝试重新表述。";
            }
            return response.substring(contentStart, contentEnd).replace("\\n", "\n").replace("\\\"", "\"");
        } catch (Exception e) {
            log.error("解析 AI 响应失败", e);
            return "抱歉，我没有理解你的问题，请尝试重新表述。";
        }
    }
}
