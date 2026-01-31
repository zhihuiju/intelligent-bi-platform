package com.yupi.springbootinit.mq;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

public class TopicConsumer {

  private static final String EXCHANGE_NAME = "topic_exchange";

  public static void main(String[] argv) throws Exception {
    ConnectionFactory factory = new ConnectionFactory();
    factory.setHost("localhost");
    Connection connection = factory.newConnection();
    Channel channel = connection.createChannel();
    channel.exchangeDeclare(EXCHANGE_NAME, "topic");

    //创建队列
    String queueName1 = "前端队列";
    channel.queueDeclare(queueName1, true, false, false, null);
    channel.queueBind(queueName1, EXCHANGE_NAME, "#.前端.#");

    String queueName2 = "后端队列";
    channel.queueDeclare(queueName2, true, false, false, null);
    channel.queueBind(queueName2, EXCHANGE_NAME, "#.后端.#");

    String queueName3 = "产品队列";
    channel.queueDeclare(queueName3, true, false, false, null);
    channel.queueBind(queueName3, EXCHANGE_NAME, "#.产品.#");

    //定义消息处理器或者时间监听器
    DeliverCallback xiaoadeliverCallback = (consumerTag, delivery) -> {
        String message = new String(delivery.getBody(), "UTF-8");
        System.out.println(" [xiaoa(前端)] Received '" +
            delivery.getEnvelope().getRoutingKey() + "':'" + message + "'");
    };

    DeliverCallback xiaobdeliverCallback = (consumerTag, delivery) -> {
        String message = new String(delivery.getBody(), "UTF-8");
        System.out.println(" [xiaob(后端)] Received '" +
                delivery.getEnvelope().getRoutingKey() + "':'" + message + "'");
    };

    DeliverCallback xiaocdeliverCallback = (consumerTag, delivery) -> {
        String message = new String(delivery.getBody(), "UTF-8");
        System.out.println(" [xiaoc(产品)] Received '" +
                delivery.getEnvelope().getRoutingKey() + "':'" + message + "'");
    };

    //定义消费者的订阅方法
    channel.basicConsume(queueName1, true, xiaoadeliverCallback, consumerTag -> { });
    channel.basicConsume(queueName2, true, xiaobdeliverCallback, consumerTag -> { });
    channel.basicConsume(queueName3, true, xiaocdeliverCallback, consumerTag -> { });
  }
}