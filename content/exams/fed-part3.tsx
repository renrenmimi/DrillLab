// Federation 考试 —— 模块 4：Task 2（Spring Boot REST 控制器）与模块 5（两道书面题）。

import type { Module } from "../types";
import { demo, real } from "../helpers";

const CONTROLLER_STARTER = `@RestController
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> getRoot() {
        return ResponseEntity.ok(Map.of(
                "message", "Welcome to TechFlow Order Service API",
                "status", "running"
        ));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String userId) {
        // TODO: Implement REST endpoint with structured logging and request validation
        return null;
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        // TODO: Implement GET endpoint for order by ID
        return null;
    }

    @GetMapping("/api/orders/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable String userId) {
        // TODO: Implement GET endpoint for orders by user ID
        return null;
    }

    @PostMapping("/api/orders")
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        // TODO: Implement POST endpoint with Bean Validation and proper HTTP status
        return null;
    }

    @PatchMapping("/api/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        // TODO: Implement PATCH endpoint for order status updates
        return null;
    }

    @DeleteMapping("/api/orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        // TODO: Implement DELETE endpoint
        return null;
    }
}`;

const CONTROLLER_SOLUTION = `@RestController
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> getRoot() {
        return ResponseEntity.ok(Map.of(
                "message", "Welcome to TechFlow Order Service API",
                "status", "running"
        ));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String userId) {
        logger.info("GET /api/orders userId={}, correlationId={}", userId, correlationId());

        // 可选过滤：？userId=123 收窄集合，而不是另开一个路由
        List<Order> orders = (userId == null || userId.isBlank())
                ? orderService.getAllOrders()
                : orderService.getOrdersByUserId(userId);

        return ResponseEntity.ok(orders);
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        logger.info("GET /api/orders/{} correlationId={}", id, correlationId());

        // 找不到时 service 抛 EntityNotFoundException，
        // 由 GlobalExceptionHandler 转成 404
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/api/orders/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable String userId) {
        logger.info("GET /api/orders/user/{} correlationId={}", userId, correlationId());
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PostMapping("/api/orders")
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        logger.info("POST /api/orders userId={}, correlationId={}",
                request.getUserId(), correlationId());

        Order created = orderService.createOrder(request);

        // 创建成功返回 201，不是 200
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/api/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String raw = statusUpdate.get("status");
        logger.info("PATCH /api/orders/{}/status status={}, correlationId={}",
                id, raw, correlationId());

        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        final OrderStatus status;
        try {
            status = OrderStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
        }

        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @DeleteMapping("/api/orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        logger.info("DELETE /api/orders/{} correlationId={}", id, correlationId());

        orderService.deleteOrder(id);

        // 没有内容可返回 -> 204
        return ResponseEntity.noContent().build();
    }

    /** CorrelationIdFilter 放在 MDC 里的 correlation id，用于串联日志 */
    private String correlationId() {
        return MDC.get("correlationId");
    }
}`;

const CONTROLLER_TEST = `@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    void shouldGetAllOrders() throws Exception {
        when(orderService.getAllOrders()).thenReturn(List.of());
        mockMvc.perform(get("/api/orders")).andExpect(status().isOk());
    }

    @Test
    void shouldGetOrderById() throws Exception {
        when(orderService.getOrderById(1L)).thenReturn(new Order());
        mockMvc.perform(get("/api/orders/1")).andExpect(status().isOk());
    }

    @Test
    void shouldCreateOrder() throws Exception {
        when(orderService.createOrder(any(CreateOrderRequest.class))).thenReturn(new Order());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "123",
                                  "items": [
                                    { "productId": "prod-789", "quantity": 2 }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldUpdateOrderStatus() throws Exception {
        when(orderService.updateOrderStatus(1L, OrderStatus.SHIPPED)).thenReturn(new Order());

        mockMvc.perform(patch("/api/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\\"status\\":\\"SHIPPED\\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDeleteOrder() throws Exception {
        mockMvc.perform(delete("/api/orders/1"))
                .andExpect(status().isNoContent());
    }
}`;

export const fedTask2: Module = {
  id: "fed-task2",
  stage: "Federation · 第 4 部分",
  title: "Task 2 · Spring Boot REST 控制器",
  summary:
    "六个端点，业务逻辑全都给好了。真正考的是「HTTP 状态码选对了吗」和「异常该谁处理」—— 而这两点恰好是那五个测试只抓住一半的地方。",
  lessons: [
    /* ---------- 4.1 ---------- */
    {
      id: "g-spring-basics",
      title: "先看懂给你的东西：Spring 的几个注解和一条请求链路",
      blurb: "没写过 Java 也能看懂 —— 这一节只讲这道题真正需要的那几个概念。",
      minutes: 16,
      objectives: [
        "认得 @RestController / @GetMapping / @PathVariable / @RequestBody 等注解",
        "说清构造器注入是什么、OrderService 是怎么进到控制器里的",
        "读懂 OrderService 提供了哪些方法、抛什么异常",
        "说清 GlobalExceptionHandler 和 CorrelationIdFilter 各自在做什么",
      ],
      whyForAssessment:
        "业务逻辑全部 PROVIDED。你要写的只是「调用 + 选状态码 + 记日志」。所以读懂已给的部分，这道题就做完一半了。",
      sourceFiles: [
        {
          path: "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/service/OrderService.java",
          role: "业务逻辑全在这里（PROVIDED）",
        },
        {
          path: "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/exception/GlobalExceptionHandler.java",
          role: "404 与 400 的统一出口（PROVIDED）",
        },
        {
          path: "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/config/CorrelationIdFilter.java",
          role: "把 correlation id 放进 MDC（PROVIDED）",
        },
        {
          path: "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
          role: "六个 TODO",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "annotations",
          heading: "这道题会用到的注解，一张表说完",
          lede: "Java 的注解就是「贴在代码上的标签」，框架读这些标签决定怎么处理。",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>注解</th>
                      <th>贴在哪</th>
                      <th>作用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>@RestController</code></td>
                      <td>类上</td>
                      <td>
                        「这个类的方法返回值直接当 HTTP 响应体（JSON）」，
                        不是返回视图名
                      </td>
                    </tr>
                    <tr>
                      <td><code>@GetMapping(&quot;/api/orders&quot;)</code></td>
                      <td>方法上</td>
                      <td>把 <code>GET /api/orders</code> 路由到这个方法</td>
                    </tr>
                    <tr>
                      <td>
                        <code>@PostMapping</code> / <code>@PatchMapping</code> /{" "}
                        <code>@DeleteMapping</code>
                      </td>
                      <td>方法上</td>
                      <td>同上，对应各自的 HTTP 方法</td>
                    </tr>
                    <tr>
                      <td><code>@PathVariable Long id</code></td>
                      <td>参数上</td>
                      <td>
                        从路径里取值：<code>/api/orders/<strong>1</strong></code>{" "}
                        → <code>id = 1L</code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>@RequestParam(required = false) String userId</code>
                      </td>
                      <td>参数上</td>
                      <td>
                        从查询串里取值：<code>?userId=123</code>；
                        <code>required = false</code> 表示可以不传（此时是 null）
                      </td>
                    </tr>
                    <tr>
                      <td><code>@RequestBody</code></td>
                      <td>参数上</td>
                      <td>把请求体的 JSON 反序列化成这个 Java 对象</td>
                    </tr>
                    <tr>
                      <td><code>@Valid</code></td>
                      <td>参数上</td>
                      <td>
                        触发 Bean Validation（校验 DTO 上的
                        <code>@NotBlank</code> 等约束）
                      </td>
                    </tr>
                    <tr>
                      <td><code>@Service</code> / <code>@Repository</code></td>
                      <td>类上</td>
                      <td>
                        「把这个类交给 Spring 管理」，于是它能被注入到别处
                      </td>
                    </tr>
                    <tr>
                      <td><code>@RestControllerAdvice</code></td>
                      <td>类上</td>
                      <td>全局异常处理器 —— 所有控制器抛的异常都会经过它</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>只有这些。</strong>这道题不需要你懂 Spring 的
                bean 生命周期、AOP、事务传播。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Annotation</th>
                      <th>Goes on</th>
                      <th>What it does</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>@RestController</code></td>
                      <td>the class</td>
                      <td>
                        &ldquo;Whatever the methods of this class return is the
                        HTTP response body (JSON)&rdquo; — not a view name
                      </td>
                    </tr>
                    <tr>
                      <td><code>@GetMapping(&quot;/api/orders&quot;)</code></td>
                      <td>a method</td>
                      <td>
                        Routes <code>GET /api/orders</code> to this method
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>@PostMapping</code> / <code>@PatchMapping</code> /{" "}
                        <code>@DeleteMapping</code>
                      </td>
                      <td>a method</td>
                      <td>Same thing for their own HTTP methods</td>
                    </tr>
                    <tr>
                      <td><code>@PathVariable Long id</code></td>
                      <td>a parameter</td>
                      <td>
                        Takes a value out of the path:{" "}
                        <code>/api/orders/<strong>1</strong></code> →{" "}
                        <code>id = 1L</code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>@RequestParam(required = false) String userId</code>
                      </td>
                      <td>a parameter</td>
                      <td>
                        Takes a value out of the query string:{" "}
                        <code>?userId=123</code>. <code>required = false</code>{" "}
                        means it may be absent, and then it is null
                      </td>
                    </tr>
                    <tr>
                      <td><code>@RequestBody</code></td>
                      <td>a parameter</td>
                      <td>
                        Deserializes the JSON request body into this Java object
                      </td>
                    </tr>
                    <tr>
                      <td><code>@Valid</code></td>
                      <td>a parameter</td>
                      <td>
                        Fires Bean Validation, which checks the{" "}
                        <code>@NotBlank</code> and friends declared on the DTO
                      </td>
                    </tr>
                    <tr>
                      <td><code>@Service</code> / <code>@Repository</code></td>
                      <td>the class</td>
                      <td>
                        &ldquo;Let Spring manage this class&rdquo;, which is what
                        makes it injectable elsewhere
                      </td>
                    </tr>
                    <tr>
                      <td><code>@RestControllerAdvice</code></td>
                      <td>the class</td>
                      <td>
                        Global exception handler — every exception thrown by any
                        controller passes through it
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>That is the whole list.</strong> This paper does not
                need you to understand Spring bean lifecycles, AOP, or
                transaction propagation.
              </p>
            </>
          ),
        },
        {
          id: "constructor-injection",
          heading: "OrderService 是怎么进到控制器里的",
          lede: "构造器注入 —— 一行代码就能理解。",
          body: (
            <>
              <p>
                看 starter 里已经给好的这几行：
              </p>
              <p>
                这是<strong>构造器注入（constructor injection）</strong>。
                流程是：
              </p>
              <ol>
                <li>
                  <code>OrderService</code> 类上有 <code>@Service</code>，
                  所以 Spring 启动时会创建它的实例并管起来。
                </li>
                <li>
                  <code>OrderController</code> 的构造器需要一个
                  <code>OrderService</code>。
                </li>
                <li>
                  Spring 创建控制器时，<strong>自动把它管着的那个实例传进来</strong>。
                </li>
              </ol>
              <p>
                所以你在方法里可以直接用 <code>orderService.xxx()</code>，
                <strong>不需要 <code>new OrderService()</code></strong>。
              </p>
              <p>
                <strong>这部分已经给好了，别动。</strong>
                你只需要知道 <code>orderService</code> 这个字段随时可用。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Look at these lines, already written for you in the starter:</p>
              <p>
                This is <strong>constructor injection</strong>. Here is the
                sequence:
              </p>
              <ol>
                <li>
                  <code>OrderService</code> carries <code>@Service</code>, so
                  Spring builds one instance at startup and holds on to it.
                </li>
                <li>
                  The constructor of <code>OrderController</code> asks for an{" "}
                  <code>OrderService</code>.
                </li>
                <li>
                  When Spring builds the controller it{" "}
                  <strong>hands over the instance it is holding</strong>.
                </li>
              </ol>
              <p>
                So inside your methods you can call{" "}
                <code>orderService.xxx()</code> straight away.{" "}
                <strong>
                  No <code>new OrderService()</code> anywhere.
                </strong>
              </p>
              <p>
                <strong>This part is already done. Leave it alone.</strong> All
                you need to know is that the <code>orderService</code> field is
                there whenever you want it.
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `private final OrderService orderService;

public OrderController(OrderService orderService) {
    this.orderService = orderService;
}`,
              {
                filename: "OrderController.java（已给好）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
              },
            ),
          ],
        },
        {
          id: "the-service",
          heading: "OrderService 给了你什么",
          lede: "这张表就是你的工具箱。写代码前抄一遍。",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>方法</th>
                      <th>返回</th>
                      <th>找不到时</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>getAllOrders()</code></td>
                      <td><code>List&lt;Order&gt;</code></td>
                      <td>返回空列表</td>
                    </tr>
                    <tr>
                      <td><code>getOrderById(Long id)</code></td>
                      <td><code>Order</code></td>
                      <td>
                        <strong>抛 <code>EntityNotFoundException</code></strong>
                      </td>
                    </tr>
                    <tr>
                      <td><code>getOrdersByUserId(String userId)</code></td>
                      <td><code>List&lt;Order&gt;</code></td>
                      <td>返回空列表</td>
                    </tr>
                    <tr>
                      <td><code>createOrder(CreateOrderRequest request)</code></td>
                      <td><code>Order</code></td>
                      <td>—（内部会查价格、算总价、计数）</td>
                    </tr>
                    <tr>
                      <td>
                        <code>updateOrderStatus(Long id, OrderStatus status)</code>
                      </td>
                      <td><code>Order</code></td>
                      <td>
                        <strong>抛 <code>EntityNotFoundException</code></strong>
                      </td>
                    </tr>
                    <tr>
                      <td><code>deleteOrder(Long id)</code></td>
                      <td><code>void</code></td>
                      <td>
                        <strong>抛 <code>EntityNotFoundException</code></strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>注意第二列的 <code>void</code> 和第三列那三个
                「抛异常」。</strong>它们直接决定了你的端点该怎么写：
              </p>
              <ul>
                <li>
                  <code>deleteOrder</code> 返回 <code>void</code> →
                  没有内容可返回 → <strong>204 No Content</strong>。
                </li>
                <li>
                  三个会抛 <code>EntityNotFoundException</code> 的方法 →
                  <strong>你不要 try/catch 它</strong>，
                  让它冒到全局处理器去（下一段说为什么）。
                </li>
              </ul>
              <p>
                <code>OrderService</code> 里还有一些你不需要管的东西：
                Micrometer 的计数器（<code>orders.created</code>、
                <code>orders.retrieved</code>）和 Timer、
                以及从 MDC 里读 correlationId 打日志。
                <strong>这些说明这个项目在演示「可观测性」这个主题</strong>——
                所以你的控制器里也该打日志、也该带 correlationId。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Returns</th>
                      <th>When nothing is found</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>getAllOrders()</code></td>
                      <td><code>List&lt;Order&gt;</code></td>
                      <td>an empty list</td>
                    </tr>
                    <tr>
                      <td><code>getOrderById(Long id)</code></td>
                      <td><code>Order</code></td>
                      <td>
                        <strong>
                          throws <code>EntityNotFoundException</code>
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td><code>getOrdersByUserId(String userId)</code></td>
                      <td><code>List&lt;Order&gt;</code></td>
                      <td>an empty list</td>
                    </tr>
                    <tr>
                      <td><code>createOrder(CreateOrderRequest request)</code></td>
                      <td><code>Order</code></td>
                      <td>
                        — (it looks up prices, totals them, bumps the counter)
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>updateOrderStatus(Long id, OrderStatus status)</code>
                      </td>
                      <td><code>Order</code></td>
                      <td>
                        <strong>
                          throws <code>EntityNotFoundException</code>
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td><code>deleteOrder(Long id)</code></td>
                      <td><code>void</code></td>
                      <td>
                        <strong>
                          throws <code>EntityNotFoundException</code>
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  Look hard at the <code>void</code> in column two and the three
                  &ldquo;throws&rdquo; cells in column three.
                </strong>{" "}
                They decide how your endpoints have to be written:
              </p>
              <ul>
                <li>
                  <code>deleteOrder</code> returns <code>void</code> → there is
                  nothing to send back → <strong>204 No Content</strong>.
                </li>
                <li>
                  The three methods that throw <code>EntityNotFoundException</code>{" "}
                  → <strong>do not try/catch them</strong>. Let the exception
                  bubble up to the global handler. The next section explains why.
                </li>
              </ul>
              <p>
                <code>OrderService</code> also holds things you can ignore: the
                Micrometer counters (<code>orders.created</code>,{" "}
                <code>orders.retrieved</code>), a Timer, and reading the
                correlationId out of MDC for logging.{" "}
                <strong>
                  All of that says the project is demonstrating observability
                </strong>{" "}
                — so your controller should log too, and it should carry the
                correlationId.
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `public Order getOrderById(Long id) {
    String correlationId = MDC.get("correlationId");
    logger.info("Fetching order by id. orderId={}, correlationId={}", id, correlationId);
    orderRetrievedCounter.increment();
    return orderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
}

public void deleteOrder(Long id) {
    if (!orderRepository.existsById(id)) {
        throw new EntityNotFoundException("Order not found with id: " + id);
    }
    orderRepository.deleteById(id);
}`,
              {
                filename: "OrderService.java（节选，PROVIDED）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/service/OrderService.java",
                highlight: [5, 6, 11, 12],
                explanation:
                  "orElseThrow 的意思是「Optional 里有值就取出来，没有就抛这个异常」。注意 service 已经自己打了日志、也自己读了 MDC —— 这是在给你示范控制器里该怎么做。",
              },
            ),
          ],
        },
        {
          id: "global-exception-handler",
          heading: "GlobalExceptionHandler：为什么你不该 try/catch",
          lede: "这是这道题最容易做反的一处设计。",
          body: (
            <>
              <p>
                <code>@RestControllerAdvice</code> 标记的类是
                <strong>全局异常处理器</strong>。任何控制器方法抛出的异常，
                如果这里有对应的 <code>@ExceptionHandler</code>，
                就由它来转成 HTTP 响应。
              </p>
              <p>项目里给好了两个：</p>
              <ul>
                <li>
                  <code>EntityNotFoundException</code> → <strong>404</strong>，
                  响应体是 <code>{"{ timestamp, status, message }"}</code>。
                </li>
                <li>
                  <code>MethodArgumentNotValidException</code>
                  （Bean Validation 失败时 Spring 自动抛的）→
                  <strong>400</strong>。
                </li>
              </ul>
              <p>
                <strong>所以控制器里正确的做法是：什么都不做。</strong>
                直接 <code>return ResponseEntity.ok(orderService.getOrderById(id))</code>。
                找不到时 service 抛异常，异常冒出控制器，
                被全局处理器接住转成 404。
              </p>
              <p>
                <strong>如果你自己 try/catch 会怎样？</strong>
                异常被你吞掉了，全局处理器永远收不到，
                于是 404 变成 200（返回 null body）或 500。
                <strong>你把项目已经做好的事情弄坏了。</strong>
              </p>
              <p>
                这是一条通用原则：<strong>有全局异常处理器的项目，
                控制器里不要写 try/catch</strong>——
                除非你要把某个异常转成<strong>不同的</strong>状态码。
                （下一节 PATCH 端点里那个 <code>ResponseStatusException</code>
                就属于这种例外情况。）
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A class marked <code>@RestControllerAdvice</code> is a{" "}
                <strong>global exception handler</strong>. Any exception thrown
                by a controller method gets turned into an HTTP response here, as
                long as there is a matching <code>@ExceptionHandler</code>.
              </p>
              <p>The project gives you two of them:</p>
              <ul>
                <li>
                  <code>EntityNotFoundException</code> → <strong>404</strong>,
                  with a body of <code>{"{ timestamp, status, message }"}</code>.
                </li>
                <li>
                  <code>MethodArgumentNotValidException</code> (which Spring
                  throws by itself when Bean Validation fails) →{" "}
                  <strong>400</strong>.
                </li>
              </ul>
              <p>
                <strong>
                  So the right move inside the controller is: do nothing.
                </strong>{" "}
                Just{" "}
                <code>return ResponseEntity.ok(orderService.getOrderById(id))</code>.
                When the order is missing the service throws, the exception
                leaves your controller, the global handler catches it and turns
                it into a 404.
              </p>
              <p>
                <strong>What happens if you try/catch it yourself?</strong> You
                swallowed the exception, the global handler never hears about it,
                and your 404 becomes a 200 with a null body — or a 500.{" "}
                <strong>You broke something the project had already done.</strong>
              </p>
              <p>
                This is a general rule:{" "}
                <strong>
                  when a project has a global exception handler, do not write
                  try/catch in controllers
                </strong>{" "}
                — unless you need to turn one exception into a{" "}
                <strong>different</strong> status code. (The{" "}
                <code>ResponseStatusException</code> in the PATCH endpoint in the
                next lesson is exactly that exception to the rule.)
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 404,
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "message", "Invalid request"
        ));
    }
}`,
              {
                filename: "GlobalExceptionHandler.java（全文，PROVIDED）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/exception/GlobalExceptionHandler.java",
              },
            ),
          ],
        },
        {
          id: "validation",
          heading: "@Valid 与 DTO 上的约束",
          body: (
            <>
              <p>
                <code>CreateOrderRequest</code> 上已经贴好了校验注解：
              </p>
              <p>
                <code>@NotBlank</code>（不能是 null / 空 / 全空格）、
                <code>@NotEmpty</code>（列表不能空）、
                <code>@Min(1)</code>（数量至少 1）、
                <code>@Valid</code>（<strong>贴在列表上时表示「连列表里每个元素也要校验」</strong>）。
              </p>
              <p>
                <strong>但这些约束只有在方法参数上写了 <code>@Valid</code>
                才会生效。</strong>starter 已经写了：
                <code>createOrder(@Valid @RequestBody CreateOrderRequest request)</code>。
                <strong>别删掉那个 <code>@Valid</code></strong> ——
                删了之后非法请求会带着空 userId 进到 service，
                400 变成 500。
              </p>
              <p>
                这也是一条设计分工：
                <strong>格式校验交给 Bean Validation，
                业务校验（比如「这个用户被冻结了」）才写在代码里。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>CreateOrderRequest</code> already carries its validation
                annotations:
              </p>
              <p>
                <code>@NotBlank</code> (not null, not empty, not all
                whitespace), <code>@NotEmpty</code> (the list cannot be empty),{" "}
                <code>@Min(1)</code> (quantity is at least 1), and{" "}
                <code>@Valid</code> (
                <strong>
                  on a list it means &ldquo;validate every element inside too&rdquo;
                </strong>
                ).
              </p>
              <p>
                <strong>
                  But none of those constraints fire unless the method parameter
                  is marked <code>@Valid</code>.
                </strong>{" "}
                The starter already did it:{" "}
                <code>createOrder(@Valid @RequestBody CreateOrderRequest request)</code>.{" "}
                <strong>
                  Do not delete that <code>@Valid</code>
                </strong>{" "}
                — without it a bad request walks into the service with an empty
                userId, and your 400 turns into a 500.
              </p>
              <p>
                This is also a division of labour:{" "}
                <strong>
                  shape checks belong to Bean Validation, business checks (say
                  &ldquo;this user is suspended&rdquo;) belong in your code.
                </strong>
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `public class CreateOrderRequest {
    @NotBlank
    private String userId;
    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
    // getter / setter ...
}

public class OrderItemRequest {
    @NotBlank
    private String productId;
    @Min(1)
    private int quantity;
    // getter / setter ...
}`,
              {
                filename: "两个 DTO（PROVIDED）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/dto/",
              },
            ),
          ],
        },
        {
          id: "correlation-filter",
          heading: "CorrelationIdFilter：Java 版的 correlation id",
          body: (
            <>
              <p>
                和 Node 那边一个思路：<strong>优先用请求头里的
                <code>X-Correlation-ID</code>，没有就生成一个 UUID</strong>。
              </p>
              <p>
                区别在于存放位置。Node 那边放进 <code>context</code> 手动往下传；
                Java 这边放进 <strong>MDC（Mapped Diagnostic Context）</strong>——
                一个和当前线程绑定的键值存储。
                这样同一个线程里<strong>任何地方</strong>都能
                <code>MDC.get(&quot;correlationId&quot;)</code> 取到，
                不需要一层层传参。
              </p>
              <p>
                注意 <code>finally</code> 里的 <code>MDC.remove</code> ——
                线程是复用的，不清理会导致下一个请求读到上一个的 id。
                <strong>这个细节要记住 ——</strong>
                它是「线程局部存储必须清理」这个通用原则的实例。
              </p>
              <p>
                <strong>你要做的：</strong>在六个端点里
                <code>logger.info(...)</code> 时带上
                <code>MDC.get(&quot;correlationId&quot;)</code>。
                第一个 TODO 明确写了
                <em>with structured logging</em>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Same idea as on the Node side:{" "}
                <strong>
                  use the <code>X-Correlation-ID</code> header if the caller sent
                  one, otherwise generate a UUID
                </strong>
                .
              </p>
              <p>
                The difference is where it gets parked. Node put it in{" "}
                <code>context</code> and passed it down by hand. Java puts it in{" "}
                <strong>MDC (Mapped Diagnostic Context)</strong> — a key-value
                store bound to the current thread. That way{" "}
                <strong>anywhere</strong> on that same thread can call{" "}
                <code>MDC.get(&quot;correlationId&quot;)</code> without threading
                a parameter through every layer.
              </p>
              <p>
                Look at the <code>MDC.remove</code> in the{" "}
                <code>finally</code> block. Threads get reused, so skipping the
                cleanup means the next request reads the previous request&rsquo;s
                id.{" "}
                <strong>
                  That detail earns your attention because it is one instance of
                  a general rule: thread-local storage must be cleaned up.
                </strong>
              </p>
              <p>
                <strong>Your job:</strong> in all six endpoints, pass{" "}
                <code>MDC.get(&quot;correlationId&quot;)</code> into your{" "}
                <code>logger.info(...)</code> calls. The very first TODO spells
                it out: <em>with structured logging</em>.
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    private static final String HEADER = "X-Correlation-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        MDC.put("correlationId", correlationId);
        response.setHeader(HEADER, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");     // 线程复用，必须清理
        }
    }
}`,
              {
                filename: "CorrelationIdFilter.java（全文，PROVIDED）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/config/CorrelationIdFilter.java",
                highlight: [13, 14, 19],
              },
            ),
          ],
        },
        {
          id: "distractors",
          heading: "两个干扰项",
          body: (
            <>
              <ul>
                <li>
                  <strong><code>java-service/orders.db</code></strong> ——
                  一个数据库文件。但 <code>pom.xml</code> 里
                  <strong>没有任何 JDBC 或 JPA 依赖</strong>
                  （只有 web / validation / actuator / test），
                  代码里也没有一处引用它。
                  数据实际来自 <code>InMemoryOrderRepository</code>
                  （一个 <code>ConcurrentHashMap</code>）。
                  <strong>看到 .db 就去配数据源，纯浪费时间。</strong>
                </li>
                <li>
                  <strong><code>MetricsConfig.java</code></strong> ——
                  一个空的 <code>@Configuration</code> 类，里面什么都没有。
                  计数器实际是在 <code>OrderService</code> 的构造器里建的。
                </li>
              </ul>
              <p>
                判断方法和 Node 那边一样：
                <strong>顺着依赖和引用找。没被 import、
                没被注入、没在配置里出现，就跟这次任务无关。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ul>
                <li>
                  <strong>
                    <code>java-service/orders.db</code>
                  </strong>{" "}
                  — a database file. But <code>pom.xml</code> carries{" "}
                  <strong>no JDBC and no JPA dependency at all</strong> (only
                  web, validation, actuator, test), and not one line of code
                  references it. The data actually comes from{" "}
                  <code>InMemoryOrderRepository</code>, which is a{" "}
                  <code>ConcurrentHashMap</code>.{" "}
                  <strong>
                    Seeing a .db file and going off to configure a datasource is
                    pure wasted time.
                  </strong>
                </li>
                <li>
                  <strong>
                    <code>MetricsConfig.java</code>
                  </strong>{" "}
                  — an empty <code>@Configuration</code> class with nothing
                  inside. The counters are actually created in the{" "}
                  <code>OrderService</code> constructor.
                </li>
              </ul>
              <p>
                Same test as on the Node side:{" "}
                <strong>
                  follow the dependencies and the references. Not imported, not
                  injected, not mentioned in config — not part of this task.
                </strong>
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-spring-exception",
          title: "找不到订单时该怎么处理",
          level: 1,
          prompt: (
            <p>
              <code>getOrderById</code> 端点里，
              <code>orderService.getOrderById(id)</code> 找不到时会抛
              <code>EntityNotFoundException</code>。
              控制器应该怎么写？
            </p>
          ),
          options: [
            { id: "a", label: "什么都不做，直接 return ResponseEntity.ok(orderService.getOrderById(id))" },
            { id: "b", label: "try/catch 住，catch 里 return ResponseEntity.notFound().build()" },
            { id: "c", label: "try/catch 住，catch 里 return null" },
            { id: "d", label: "先调 existsById 检查一遍再取" },
          ],
          answer: ["a"],
          explain: (
            <>
              项目里已经有 <code>@RestControllerAdvice</code> 标记的
              <code>GlobalExceptionHandler</code>，它专门把
              <code>EntityNotFoundException</code> 转成带 JSON 体的 404。
              <strong>让异常冒出去就行。</strong>
              <br />
              B 虽然结果也是 404，但<strong>响应体丢了</strong>
              （全局处理器返回的是
              <code>{"{ timestamp, status, message }"}</code>），
              而且重复实现了已有的能力。
              <br />
              C 是最糟的 —— 404 变成 200。
              <br />
              D 也没必要，而且 <code>OrderService</code> 没暴露
              <code>existsById</code>。
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-spring-annotations",
          title: "这三个参数注解各从哪取值",
          level: 1,
          prompt: (
            <p>
              请求是{" "}
              <code>PATCH /api/orders/7/status</code>，
              body 是 <code>{'{"status":"SHIPPED"}'}</code>。
              <br />
              方法签名是{" "}
              <code>
                updateOrderStatus(@PathVariable Long id, @RequestBody
                Map&lt;String,String&gt; statusUpdate)
              </code>
              。<code>id</code> 和 <code>statusUpdate</code> 分别是什么？
            </p>
          ),
          options: [
            { id: "a", label: "id = 7L；statusUpdate = { \"status\": \"SHIPPED\" }" },
            { id: "b", label: "id = null；statusUpdate = { \"id\": \"7\", \"status\": \"SHIPPED\" }" },
            { id: "c", label: "id = 7L；statusUpdate = \"SHIPPED\"" },
            { id: "d", label: "两个都从查询串取" },
          ],
          answer: ["a"],
          explain: (
            <>
              <code>@PathVariable</code> 从<strong>路径</strong>里取 ——
              <code>/api/orders/<strong>7</strong>/status</code> 对应
              <code>{"{id}"}</code> 那一段，Spring 自动把 <code>&quot;7&quot;</code>
              转成 <code>Long 7L</code>。
              <br />
              <code>@RequestBody</code> 把整个请求体的 JSON 反序列化成
              <code>Map</code>，所以 <code>statusUpdate.get(&quot;status&quot;)</code>
              才是 <code>&quot;SHIPPED&quot;</code>。
              <br />
              注意它是 <strong>Map 而不是 DTO</strong> ——
              所以<strong>没有 Bean Validation 保护</strong>，
              下一节会讲这意味着你必须自己校验。
            </>
          ),
        },
      ],
      transfer: [
        { signal: "项目里有 @RestControllerAdvice", reachFor: "控制器里不要 try/catch，让异常冒出去" },
        { signal: "参数上有 @Valid", reachFor: "格式校验交给 Bean Validation，别自己写" },
        { signal: "service 方法返回 void", reachFor: "端点大概该返回 204" },
        { signal: "看到一个可疑的资源文件（.db 之类）", reachFor: "查 pom.xml 有没有对应依赖，没有就是干扰项" },
        { signal: "需要 correlation id", reachFor: "Java 用 MDC.get()，别自己一层层传参" },
      ],
      recap: [
        "构造器注入已经写好，orderService 随时可用，不要 new。",
        "OrderService 的三个方法会抛 EntityNotFoundException —— 别 try/catch，交给全局处理器转 404。",
        "deleteOrder 返回 void，暗示端点该返回 204。",
        "@Valid 必须保留，格式校验靠它；MDC.get(\"correlationId\") 用来打结构化日志。",
        "orders.db 和 MetricsConfig 都是干扰项 —— pom.xml 里没有数据库依赖。",
      ],
    },

    /* ---------- 4.2 ---------- */
    {
      id: "g-endpoints",
      title: "六个端点：状态码就是这道题的全部",
      blurb: "五个测试只抓住两个错。另外三个端点全返回 null 也能过 —— 这一节讲怎么真的做对。",
      minutes: 18,
      objectives: [
        "独立写出六个端点",
        "说清 200 / 201 / 204 / 400 / 404 各在什么时候用",
        "解释为什么 return null 能骗过三个测试",
        "写出 PATCH 端点里字符串转 enum 的安全处理",
      ],
      whyForAssessment:
        "审计实测：baseline 状态下六个端点全部 return null，五个测试通过了三个。只有 201 和 204 那两条抓住了错。这是整门考试「测试通过 ≠ 做对了」最夸张的一个实例。",
      sourceFiles: [
        {
          path: "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
          role: "六个 TODO",
          edit: true,
        },
        {
          path: "graphql-federation-practice/java-service/src/test/java/com/techflow/orders/OrderControllerTest.java",
          role: "五个测试",
        },
      ],
      concepts: [
        {
          id: "the-brief",
          heading: "题面与 starter",
          body: (
            <>
              <p>README 里 Task 2 的原文：</p>
              <p>
                六个端点，六个 <code>{"// TODO"}</code>，
                六个 <code>return null</code>。
                <strong>业务逻辑一行都不用你写</strong>——
                全在 <code>OrderService</code> 里。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Task 2 in the README, word for word:</p>
              <p>
                Six endpoints, six <code>{"// TODO"}</code> markers, six{" "}
                <code>return null</code> statements.{" "}
                <strong>You write no business logic at all</strong> — it is all
                sitting in <code>OrderService</code>.
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `## Task 2: Spring Boot REST Controller

Implement REST endpoints in
\`java-service/src/main/java/com/techflow/orders/controller/OrderController.java\`:

- \`GET /api/orders\`
- \`GET /api/orders/{id}\`
- \`GET /api/orders/user/{userId}\`
- \`POST /api/orders\`
- \`PATCH /api/orders/{id}/status\`
- \`DELETE /api/orders/{id}\`

Use the provided \`OrderService\` for business logic.`,
              {
                filename: "README.md（Task 2 原文）",
                sourceFile: "graphql-federation-practice/README.md",
              },
            ),
            real("java", CONTROLLER_STARTER, {
              filename: "OrderController.java（starter）",
              sourceFile:
                "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
              highlight: [24, 25, 30, 31, 36, 37, 43, 44, 51, 52, 57, 58],
              collapsible: true,
            }),
          ],
        },
        {
          id: "the-null-trap",
          heading: "实测：六个端点全返回 null，五个测试过了三个",
          lede: "这是本项目最值得记住的一个事实。",
          body: (
            <>
              <p>
                审计时我在临时目录里跑了 baseline（原封不动的 starter）：
              </p>
              <p>
                <strong>为什么 return null 能过？</strong>
                因为 Spring 里，控制器方法返回 <code>null</code> 时，
                框架认为「你已经自己处理完响应了」，
                于是返回一个 <strong>200 OK + 空 body</strong>。
              </p>
              <p>
                而那三个通过的测试断言的是 <code>status().isOk()</code> ——
                也就是 200。<strong>正好符合。</strong>
              </p>
              <p>
                只有两条测试断言了非 200 的状态码
                （<code>isCreated()</code> = 201、
                <code>isNoContent()</code> = 204），
                所以只有它们抓住了错。
              </p>
              <p>
                <strong>结论和 Node 那边一样，但更极端：</strong>
                <strong>三个端点完全没实现，测试却是绿的。</strong>
                如果你只看测试，会以为自己做完了 60%，
                实际上是 0%。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                During the audit I ran the baseline in a scratch copy — the
                starter, untouched:
              </p>
              <p>
                <strong>Why does returning null pass?</strong> Because when a
                Spring controller method returns <code>null</code>, the framework
                assumes you already dealt with the response yourself, so it sends
                back a <strong>200 OK with an empty body</strong>.
              </p>
              <p>
                And the three tests that passed assert{" "}
                <code>status().isOk()</code> — that is, 200.{" "}
                <strong>Exact match.</strong>
              </p>
              <p>
                Only two tests assert a status other than 200 (
                <code>isCreated()</code> = 201, <code>isNoContent()</code> = 204),
                so those two are the only ones that caught anything.
              </p>
              <p>
                <strong>Same lesson as on the Node side, only worse:</strong>{" "}
                <strong>
                  three endpoints are not implemented at all and the suite is
                  green.
                </strong>{" "}
                Judging by tests alone you would think you were 60% done. You are
                at 0%.
              </p>
            </>
          ),
          code: [
            real(
              "bash",
              `$ mvn test        # baseline，六个端点全是 return null

[ERROR] Tests run: 5, Failures: 2, Errors: 0, Skipped: 0
[ERROR]   OrderControllerTest.shouldCreateOrder:58 Status expected:<201> but was:<200>
[ERROR]   OrderControllerTest.shouldDeleteOrder:74 Status expected:<204> but was:<200>

# 通过的三个：
#   ✓ shouldGetAllOrders      断言 isOk()  → return null 也是 200
#   ✓ shouldGetOrderById      断言 isOk()  → 同上
#   ✓ shouldUpdateOrderStatus 断言 isOk()  → 同上`,
              { filename: "本机实测（scratchpad 副本，未改动源项目）" },
            ),
          ],
        },
        {
          id: "status-codes",
          heading: "五个状态码，各自什么时候用",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>状态码</th>
                      <th>语义</th>
                      <th>本题里哪个端点</th>
                      <th>怎么写</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>200 OK</strong></td>
                      <td>成功，有内容返回</td>
                      <td>三个 GET、PATCH</td>
                      <td><code>ResponseEntity.ok(body)</code></td>
                    </tr>
                    <tr>
                      <td><strong>201 Created</strong></td>
                      <td>创建成功</td>
                      <td>POST</td>
                      <td>
                        <code>
                          ResponseEntity.status(HttpStatus.CREATED).body(created)
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>204 No Content</strong></td>
                      <td>成功，<strong>没有</strong>内容返回</td>
                      <td>DELETE</td>
                      <td><code>ResponseEntity.noContent().build()</code></td>
                    </tr>
                    <tr>
                      <td><strong>400 Bad Request</strong></td>
                      <td>请求本身不合法</td>
                      <td>
                        POST（Bean Validation 自动）、
                        PATCH（status 非法，<strong>要你写</strong>）
                      </td>
                      <td>
                        <code>
                          throw new
                          ResponseStatusException(HttpStatus.BAD_REQUEST, msg)
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>404 Not Found</strong></td>
                      <td>目标不存在</td>
                      <td>
                        GET by id、PATCH、DELETE
                        （全局处理器自动）
                      </td>
                      <td>不写 —— 让 service 的异常冒出去</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>201 和 204 是这道题的分水岭。</strong>
                它们也是最容易忘的 —— 因为
                <code>ResponseEntity.ok()</code> 用惯了，
                手会自动打出来。
              </p>
              <p>
                记一个判据：
                <strong>「有东西返回吗？」没有 → 204。
                「是新造了一个资源吗？」是 → 201。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Meaning</th>
                      <th>Which endpoint here</th>
                      <th>How to write it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>200 OK</strong></td>
                      <td>Success, with content</td>
                      <td>the three GETs and PATCH</td>
                      <td><code>ResponseEntity.ok(body)</code></td>
                    </tr>
                    <tr>
                      <td><strong>201 Created</strong></td>
                      <td>Created something</td>
                      <td>POST</td>
                      <td>
                        <code>
                          ResponseEntity.status(HttpStatus.CREATED).body(created)
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>204 No Content</strong></td>
                      <td>
                        Success, with <strong>no</strong> content
                      </td>
                      <td>DELETE</td>
                      <td><code>ResponseEntity.noContent().build()</code></td>
                    </tr>
                    <tr>
                      <td><strong>400 Bad Request</strong></td>
                      <td>The request itself is invalid</td>
                      <td>
                        POST (Bean Validation does it), PATCH (a bad status,{" "}
                        <strong>you write this one</strong>)
                      </td>
                      <td>
                        <code>
                          throw new
                          ResponseStatusException(HttpStatus.BAD_REQUEST, msg)
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>404 Not Found</strong></td>
                      <td>The target does not exist</td>
                      <td>
                        GET by id, PATCH, DELETE (the global handler does it)
                      </td>
                      <td>
                        Write nothing — let the service exception bubble out
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>201 and 204 are the watershed of this paper.</strong>{" "}
                They are also the easiest to forget, because your hands type{" "}
                <code>ResponseEntity.ok()</code> out of habit.
              </p>
              <p>
                One test to remember:{" "}
                <strong>
                  &ldquo;Is there anything to send back?&rdquo; No → 204.
                  &ldquo;Did I just create a resource?&rdquo; Yes → 201.
                </strong>
              </p>
            </>
          ),
        },
        {
          id: "the-optional-filter",
          heading: "GET /api/orders 的可选过滤",
          body: (
            <>
              <p>
                第一个端点的签名里有一个
                <code>@RequestParam(required = false) String userId</code>。
                <strong>这个参数是提示</strong>：
                它要求你实现「可选过滤」。
              </p>
              <p>
                <code>?userId=123</code> 传了 → 只返回那个用户的订单。
                没传（<code>userId</code> 是 <code>null</code>）→ 返回全部。
              </p>
              <p>
                <strong>注意要同时判断 null 和空白。</strong>
                <code>?userId=</code> 这种写法会让 userId 是空字符串
                而不是 null，用 <code>isBlank()</code> 一起挡掉。
              </p>
              <p>
                TODO 原文写的是
                <em>with structured logging and request validation</em>——
                「request validation」指的就是这个判断。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The first endpoint&rsquo;s signature contains a{" "}
                <code>@RequestParam(required = false) String userId</code>.{" "}
                <strong>That parameter is the hint</strong>: it is asking you to
                implement optional filtering.
              </p>
              <p>
                <code>?userId=123</code> was sent → return only that user&rsquo;s
                orders. Not sent (<code>userId</code> is <code>null</code>) →
                return everything.
              </p>
              <p>
                <strong>Check for blank as well as null.</strong> A request like{" "}
                <code>?userId=</code> gives you an empty string, not null, so
                block both with <code>isBlank()</code>.
              </p>
              <p>
                The TODO reads{" "}
                <em>with structured logging and request validation</em> — that
                &ldquo;request validation&rdquo; is exactly this check.
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `@GetMapping("/api/orders")
public ResponseEntity<List<Order>> getAllOrders(
        @RequestParam(required = false) String userId) {
    logger.info("GET /api/orders userId={}, correlationId={}", userId, correlationId());

    List<Order> orders = (userId == null || userId.isBlank())
            ? orderService.getAllOrders()
            : orderService.getOrdersByUserId(userId);

    return ResponseEntity.ok(orders);
}`,
              { filename: "第一个端点（参考答案）", highlight: [6, 7, 8] },
            ),
          ],
        },
        {
          id: "patch-enum",
          heading: "PATCH 端点：字符串转 enum 是唯一需要动脑的地方",
          lede: "这个端点收 Map 而不是 DTO，所以没有 Bean Validation 保护。",
          body: (
            <>
              <p>
                请求体是 <code>{'{"status":"SHIPPED"}'}</code>，
                但 <code>orderService.updateOrderStatus</code>
                需要的是 <code>OrderStatus</code> 枚举。
                所以必须转换。
              </p>
              <p>
                <code>OrderStatus.valueOf(&quot;SHIPPED&quot;)</code> 能转，
                但有两个坑：
              </p>
              <ul>
                <li>
                  <strong><code>valueOf</code> 大小写敏感。</strong>
                  <code>valueOf(&quot;shipped&quot;)</code> 会抛
                  <code>IllegalArgumentException</code>。
                  所以要 <code>toUpperCase()</code>。
                </li>
                <li>
                  <strong>非法值会抛异常。</strong>
                  <code>valueOf(&quot;FLYING&quot;)</code> 抛
                  <code>IllegalArgumentException</code>，
                  而<strong>全局处理器没有处理它</strong>——
                  所以会变成 <strong>500</strong>。
                  但语义上这是客户端的错，应该是 <strong>400</strong>。
                </li>
              </ul>
              <p>
                <strong>这里是本题唯一该写 try/catch 的地方</strong>——
                因为要把一种异常转成<strong>不同的</strong>状态码。
                用 <code>ResponseStatusException</code> 最省事：
                它是 Spring 提供的「带状态码的异常」，
                不需要额外的 handler。
              </p>
              <p>
                <strong>还要挡住 status 缺失的情况。</strong>
                <code>{"{}"}</code> 这种 body 会让
                <code>statusUpdate.get(&quot;status&quot;)</code> 返回 null，
                <code>null.trim()</code> 直接 NPE → 500。
                同样应该是 400。
              </p>
              <p>
                <strong>这两条测试都没查。</strong>
                测试只发了合法的 <code>SHIPPED</code>。
                但它们是明显的正确性问题 —— 人工 review 会看。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The request body is <code>{'{"status":"SHIPPED"}'}</code>, but{" "}
                <code>orderService.updateOrderStatus</code> wants an{" "}
                <code>OrderStatus</code> enum. So you have to convert.
              </p>
              <p>
                <code>OrderStatus.valueOf(&quot;SHIPPED&quot;)</code> does the
                conversion, but it has two traps:
              </p>
              <ul>
                <li>
                  <strong>
                    <code>valueOf</code> is case sensitive.
                  </strong>{" "}
                  <code>valueOf(&quot;shipped&quot;)</code> throws{" "}
                  <code>IllegalArgumentException</code>. So call{" "}
                  <code>toUpperCase()</code> first.
                </li>
                <li>
                  <strong>An invalid value throws.</strong>{" "}
                  <code>valueOf(&quot;FLYING&quot;)</code> throws{" "}
                  <code>IllegalArgumentException</code>, and{" "}
                  <strong>the global handler does not handle that one</strong> —
                  so it comes out as a <strong>500</strong>. But this is the
                  client&rsquo;s mistake, so it should be a{" "}
                  <strong>400</strong>.
                </li>
              </ul>
              <p>
                <strong>
                  This is the one place in this paper where try/catch belongs
                </strong>{" "}
                — because you are turning one exception into a{" "}
                <strong>different</strong> status code.{" "}
                <code>ResponseStatusException</code> is the cheapest way: it is
                Spring&rsquo;s built-in &ldquo;exception carrying a status
                code&rdquo;, and it needs no extra handler.
              </p>
              <p>
                <strong>Block the missing-status case too.</strong> A body of{" "}
                <code>{"{}"}</code> makes{" "}
                <code>statusUpdate.get(&quot;status&quot;)</code> return null, and{" "}
                <code>null.trim()</code> is an NPE → 500. That should be a 400
                as well.
              </p>
              <p>
                <strong>Neither of these is tested.</strong> The tests only send
                a valid <code>SHIPPED</code>. But they are plain correctness bugs
                — a human reviewer will look.
              </p>
            </>
          ),
          code: [
            real(
              "java",
              `@PatchMapping("/api/orders/{id}/status")
public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> statusUpdate) {
    String raw = statusUpdate.get("status");
    logger.info("PATCH /api/orders/{}/status status={}, correlationId={}",
            id, raw, correlationId());

    if (raw == null || raw.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
    }

    final OrderStatus status;
    try {
        status = OrderStatus.valueOf(raw.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
    }

    return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
}`,
              {
                filename: "PATCH 端点（参考答案）",
                highlight: [9, 10, 11, 14, 15, 16, 17, 18],
              },
            ),
          ],
        },
        {
          id: "full-solution",
          heading: "六个端点的完整实现",
          lede: "审计实测：这样写之后 5 个测试全过，BUILD SUCCESS。",
          body: (
            <>
              <p>
                注意最下面那个私有方法 <code>correlationId()</code> ——
                把 <code>MDC.get(&quot;correlationId&quot;)</code>
                包一层，六个端点都能用，也让日志语句短一些。
                <strong>这种小重构在 review 里是加分项。</strong>
              </p>
              <p>
                需要新增的 import：<code>OrderStatus</code>、
                <code>Logger</code> / <code>LoggerFactory</code>、
                <code>MDC</code>、<code>HttpStatus</code>、
                <code>ResponseStatusException</code>。
                starter 里没有它们。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Notice the little private <code>correlationId()</code> method at
                the bottom. It wraps{" "}
                <code>MDC.get(&quot;correlationId&quot;)</code> so all six
                endpoints can use it and the log statements stay short.{" "}
                <strong>
                  A small refactor like that scores points in review.
                </strong>
              </p>
              <p>
                Imports you have to add: <code>OrderStatus</code>,{" "}
                <code>Logger</code> / <code>LoggerFactory</code>,{" "}
                <code>MDC</code>, <code>HttpStatus</code>,{" "}
                <code>ResponseStatusException</code>. None of them are in the
                starter.
              </p>
            </>
          ),
          code: [
            real("java", CONTROLLER_SOLUTION, {
              filename: "OrderController.java（完整参考答案，实测 5/5 通过）",
              collapsible: true,
            }),
            real(
              "bash",
              `$ mvn test

[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time:  18.694 s

# 日志里能看到 correlationId 正常注入：
INFO c.t.orders.controller.OrderController : DELETE /api/orders/1 correlationId=0e157516-...
INFO c.t.orders.controller.OrderController : PATCH /api/orders/1/status status=SHIPPED, correlationId=7b441d8d-...
INFO c.t.orders.controller.OrderController : POST /api/orders userId=123, correlationId=3bf0f9c5-...`,
              { filename: "审计时的真实输出（参考解法）" },
            ),
          ],
        },
        {
          id: "the-tests",
          heading: "五个测试怎么读",
          body: (
            <>
              <p>
                <code>@WebMvcTest(OrderController.class)</code> 的意思是
                <strong>「只启动 Web 层，只加载这一个控制器」</strong>。
                不会启动完整的 Spring 应用、不会加载 service 和 repository。
              </p>
              <p>
                <code>@MockBean OrderService</code> 用一个
                <strong>假的</strong> OrderService 替换真的。
                所以 <code>when(orderService.getAllOrders()).thenReturn(List.of())</code>
                这一行是在说「如果被调用了，就返回空列表」。
              </p>
              <p>
                <strong>这意味着测试完全不验证业务逻辑</strong>——
                它只验证<strong>「路由对不对、状态码对不对」</strong>。
                所以：
              </p>
              <ul>
                <li>
                  ✅ 能抓住：路径写错、HTTP 方法写错、状态码写错。
                </li>
                <li>
                  ❌ 抓不到：调错了 service 方法
                  （比如 GET by id 里调了 <code>getAllOrders</code>）、
                  可选过滤没实现、PATCH 的非法值没挡、日志没打。
                </li>
              </ul>
              <p>
                <code>MockMvc</code> 是「不起真实服务器的 HTTP 客户端」——
                它直接把请求喂给 Spring 的 DispatcherServlet，
                所以跑得很快（整个测试 2 秒）。
              </p>
              <p>
                注意 <code>shouldUpdateOrderStatus</code> 那条：
                <code>when(orderService.updateOrderStatus(1L, OrderStatus.SHIPPED))</code>
                <strong>指定了确切的枚举值</strong>。
                如果你的转换写错了（比如没 <code>toUpperCase</code>
                而客户端传的是小写），mock 不匹配，
                会返回 <code>null</code> → 依然是 200 → <strong>测试还是过</strong>。
                <strong>又一个抓不到的地方。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>@WebMvcTest(OrderController.class)</code> means{" "}
                <strong>
                  &ldquo;boot the web layer only, and load just this one
                  controller&rdquo;
                </strong>
                . No full Spring application, no service, no repository.
              </p>
              <p>
                <code>@MockBean OrderService</code> swaps the real service for a{" "}
                <strong>fake</strong> one. So the line{" "}
                <code>when(orderService.getAllOrders()).thenReturn(List.of())</code>{" "}
                says &ldquo;if this gets called, hand back an empty list&rdquo;.
              </p>
              <p>
                <strong>
                  Which means the tests verify no business logic whatsoever
                </strong>{" "}
                — they only verify{" "}
                <strong>
                  &ldquo;is the route right, is the status code right&rdquo;
                </strong>
                . So:
              </p>
              <ul>
                <li>
                  ✅ Caught: a wrong path, a wrong HTTP method, a wrong status
                  code.
                </li>
                <li>
                  ❌ Missed: calling the wrong service method (GET by id calling{" "}
                  <code>getAllOrders</code>, say), optional filtering not
                  implemented, PATCH not blocking bad values, no logging at all.
                </li>
              </ul>
              <p>
                <code>MockMvc</code> is an HTTP client that never starts a real
                server — it feeds requests straight into Spring&rsquo;s
                DispatcherServlet, which is why it is fast (two seconds for the
                whole suite).
              </p>
              <p>
                Look closely at <code>shouldUpdateOrderStatus</code>:{" "}
                <code>when(orderService.updateOrderStatus(1L, OrderStatus.SHIPPED))</code>{" "}
                <strong>pins the exact enum value</strong>. If your conversion is
                wrong (no <code>toUpperCase</code> while the client sends
                lowercase), the mock does not match, it returns{" "}
                <code>null</code> → still a 200 →{" "}
                <strong>the test still passes</strong>.{" "}
                <strong>One more thing it cannot catch.</strong>
              </p>
            </>
          ),
          code: [
            real("java", CONTROLLER_TEST, {
              filename: "OrderControllerTest.java（全文，PROVIDED）",
              sourceFile:
                "graphql-federation-practice/java-service/src/test/java/com/techflow/orders/OrderControllerTest.java",
              highlight: [1, 5, 6, 25, 26, 27, 28, 29, 30, 31, 32, 33],
              collapsible: true,
            }),
          ],
        },
        {
          id: "self-check",
          heading: "测试之外的自检清单",
          body: (
            <>
              <p>
                因为测试覆盖很弱，所以必须自己补一遍。
                <code>mvn spring-boot:run</code> 起服务，然后用 curl：
              </p>
              <p>
                <strong>第 4 条和第 5 条测试完全没覆盖</strong>，
                但它们是这个端点该有的行为。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Test coverage here is weak, so you have to fill the gap by hand.
                Start the service with <code>mvn spring-boot:run</code>, then
                reach for curl:
              </p>
              <p>
                <strong>
                  Items 4 and 5 are not covered by any test
                </strong>
                , yet they are behaviour these endpoints are supposed to have.
              </p>
            </>
          ),
          code: [
            real(
              "bash",
              `cd java-service
mvn spring-boot:run     # 起在 8080

# 1. 全部 + 可选过滤（测试没覆盖过滤）
curl -s localhost:8080/api/orders
curl -s "localhost:8080/api/orders?userId=123"     # 应该只返回 user 123 的

# 2. 单个存在 vs 不存在（测试没覆盖 404）
curl -i -s localhost:8080/api/orders/1             # 200 + JSON
curl -i -s localhost:8080/api/orders/999           # 404 + { timestamp, status, message }

# 3. 创建（应该是 201）
curl -i -s -X POST localhost:8080/api/orders \\
  -H 'Content-Type: application/json' \\
  -d '{"userId":"123","items":[{"productId":"prod-789","quantity":2}]}'

# 4. 创建时校验失败（应该是 400，测试没覆盖）
curl -i -s -X POST localhost:8080/api/orders \\
  -H 'Content-Type: application/json' \\
  -d '{"userId":"","items":[]}'

# 5. PATCH 非法状态（应该是 400 而不是 500，测试没覆盖）
curl -i -s -X PATCH localhost:8080/api/orders/1/status \\
  -H 'Content-Type: application/json' -d '{"status":"FLYING"}'

# 6. 删除（应该是 204，空 body）
curl -i -s -X DELETE localhost:8080/api/orders/1

# 7. correlation id 透传（响应头里应该有同一个 id）
curl -i -s -H 'X-Correlation-ID: my-trace-1' localhost:8080/api/orders`,
              { filename: "手动自检" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-status-post",
          title: "POST 创建成功该返回什么",
          level: 1,
          prompt: (
            <p>
              <code>POST /api/orders</code> 成功创建了一个订单。
              该返回哪个状态码，怎么写？
            </p>
          ),
          options: [
            { id: "a", label: "ResponseEntity.ok(created) —— 200" },
            { id: "b", label: "ResponseEntity.status(HttpStatus.CREATED).body(created) —— 201" },
            { id: "c", label: "ResponseEntity.noContent().build() —— 204" },
            { id: "d", label: "ResponseEntity.accepted().body(created) —— 202" },
          ],
          answer: ["b"],
          explain: (
            <>
              <strong>201 Created</strong> 是「创建成功」的标准状态码。
              测试直接断言 <code>status().isCreated()</code>。
              <br />
              A 是最常见的错法 —— <code>ResponseEntity.ok()</code>
              用惯了，手会自动打出来。<strong>这条测试就是专门抓它的。</strong>
              <br />
              C 是 DELETE 用的；D（202 Accepted）表示「已收到，稍后处理」，
              用于异步场景。
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-null-passes",
          title: "为什么 return null 能骗过三个测试",
          level: 1,
          prompt: (
            <p>
              baseline 状态下六个端点全是 <code>return null</code>，
              五个测试却通过了三个。为什么？
            </p>
          ),
          options: [
            { id: "a", label: "那三个测试写错了" },
            { id: "b", label: "Spring 里控制器返回 null 会得到 200 + 空 body，而那三条测试断言的正好是 isOk()" },
            { id: "c", label: "@MockBean 让所有断言都通过" },
            { id: "d", label: "Maven 缓存了上次的结果" },
          ],
          answer: ["b"],
          explain: (
            <>
              控制器方法返回 <code>null</code> 时，Spring 认为
              「响应已经被你自己处理了」，于是给出
              <strong>200 OK + 空 body</strong>。
              <br />
              三条断言 <code>isOk()</code> 的测试恰好符合。
              只有断言 201 和 204 的那两条抓住了错。
              <br />
              <strong>这是整门考试「测试通过 ≠ 做对了」最夸张的实例：
              三个端点完全没实现，测试却是绿的。</strong>
            </>
          ),
        },
        {
          kind: "fill-blank",
          id: "g-endpoints-blank",
          title: "补全三个关键端点的状态码与调用",
          level: 2,
          prompt: (
            <p>
              五个空。第 2、4、5 个是这道题真正的得分点。
            </p>
          ),
          language: "java",
          filename: "OrderController.java",
          sourceFile:
            "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
          template: `@GetMapping("/api/orders/{id}")
public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
    // 找不到时 service 抛 EntityNotFoundException，交给全局处理器
    return ResponseEntity.___1___(orderService.getOrderById(id));
}

@PostMapping("/api/orders")
public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
    Order created = orderService.createOrder(request);
    return ResponseEntity.status(HttpStatus.___2___).body(created);
}

@PatchMapping("/api/orders/{id}/status")
public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> statusUpdate) {
    String raw = statusUpdate.get("status");
    if (raw == null || raw.isBlank()) {
        throw new ResponseStatusException(HttpStatus.___3___, "status is required");
    }
    OrderStatus status = OrderStatus.___4___(raw.trim().toUpperCase());
    return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
}

@DeleteMapping("/api/orders/{id}")
public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
    orderService.deleteOrder(id);
    return ResponseEntity.___5___().build();
}`,
          blanks: [
            {
              n: 1,
              accept: ["ok"],
              hint: "成功且有内容返回。",
              why: (
                <>
                  <code>ok</code> —— 200。
                  <br />
                  注意这里<strong>不需要</strong>处理找不到的情况：
                  <code>orderService.getOrderById</code> 会抛
                  <code>EntityNotFoundException</code>，
                  由 <code>GlobalExceptionHandler</code> 转成 404。
                  自己 try/catch 反而会破坏它。
                </>
              ),
              width: 4,
            },
            {
              n: 2,
              accept: ["CREATED"],
              hint: "创建成功的标准状态码，测试断言 isCreated()。",
              why: (
                <>
                  <code>CREATED</code> —— 201。
                  <br />
                  <strong>这是本题两个被测试抓住的错之一。</strong>
                  baseline 里 <code>return null</code> 给出 200，
                  测试报
                  <code>Status expected:&lt;201&gt; but was:&lt;200&gt;</code>。
                </>
              ),
              width: 9,
            },
            {
              n: 3,
              accept: ["BAD_REQUEST"],
              hint: "请求体里缺了必需字段，这是谁的错？",
              why: (
                <>
                  <code>BAD_REQUEST</code> —— 400。客户端没给 status，
                  是请求本身的问题。
                  <br />
                  <strong>不写这个判断会怎样？</strong>
                  <code>null.trim()</code> 抛 NPE，
                  全局处理器没处理 NPE → <strong>500</strong>。
                  把客户端的错报成服务器的错。
                  <br />
                  测试没查这个，但它是明显的正确性问题。
                </>
              ),
              width: 14,
            },
            {
              n: 4,
              accept: ["valueOf"],
              hint: "Java enum 提供的「字符串转枚举」静态方法。",
              why: (
                <>
                  <code>valueOf</code>。<strong>它大小写敏感</strong>，
                  所以前面要 <code>toUpperCase()</code>；
                  <strong>非法值会抛 IllegalArgumentException</strong>，
                  所以真实答案里还包了一层 try/catch 转成 400。
                  <br />
                  这一处是全题唯一该写 try/catch 的地方 ——
                  因为要把一种异常转成<strong>不同的</strong>状态码。
                </>
              ),
              width: 9,
            },
            {
              n: 5,
              accept: ["noContent"],
              hint: "删除成功，没有任何内容可返回。",
              why: (
                <>
                  <code>noContent</code> —— 204。
                  <br />
                  判据：<code>orderService.deleteOrder</code> 返回
                  <code>void</code>，没东西可返回 → 204。
                  <br />
                  <strong>这是本题第二个被测试抓住的错。</strong>
                  测试报
                  <code>Status expected:&lt;204&gt; but was:&lt;200&gt;</code>。
                  注意后面还要 <code>.build()</code> ——
                  <code>noContent()</code> 返回的是 builder。
                </>
              ),
              width: 12,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "g-endpoints-write",
          title: "不看答案，自己写出全部六个端点",
          level: 3,
          prompt: (
            <p>
              六个端点一起写。业务逻辑全部调 <code>orderService</code>，
              你负责选对状态码、处理可选参数、转 enum、打日志。
            </p>
          ),
          language: "java",
          filename: "OrderController.java",
          sourceFile:
            "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
          starter: `// OrderService 提供：
//   getAllOrders()                          -> List<Order>
//   getOrderById(Long)                      -> Order（找不到抛 EntityNotFoundException）
//   getOrdersByUserId(String)               -> List<Order>
//   createOrder(CreateOrderRequest)         -> Order
//   updateOrderStatus(Long, OrderStatus)    -> Order（找不到抛 EntityNotFoundException）
//   deleteOrder(Long)                       -> void（找不到抛 EntityNotFoundException）
// GlobalExceptionHandler 已把 EntityNotFoundException -> 404，校验失败 -> 400
// correlation id：MDC.get("correlationId")

@GetMapping("/api/orders")
public ResponseEntity<List<Order>> getAllOrders(@RequestParam(required = false) String userId) {
}

@GetMapping("/api/orders/{id}")
public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
}

@GetMapping("/api/orders/user/{userId}")
public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable String userId) {
}

@PostMapping("/api/orders")
public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
}

@PatchMapping("/api/orders/{id}/status")
public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> statusUpdate) {
}

@DeleteMapping("/api/orders/{id}")
public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
}`,
          requirements: [
            "GET /api/orders：？userId= 传了就按用户过滤，没传返回全部；200",
            "GET /api/orders/{id}：200；不要 try/catch，让 404 由全局处理器给出",
            "GET /api/orders/user/{userId}：200",
            "POST /api/orders：201 Created",
            "PATCH /api/orders/{id}/status：把 body 里的字符串转成 OrderStatus；缺失或非法值返回 400；成功 200",
            "DELETE /api/orders/{id}：204 No Content",
            "六个端点都用 logger.info 打日志，并带上 MDC 里的 correlationId",
          ],
          checks: [
            { label: "POST 用了 HttpStatus.CREATED（201）", must: "HttpStatus\\.CREATED" },
            { label: "DELETE 用了 noContent()（204）", must: "noContent\\s*\\(\\s*\\)" },
            { label: "GET /api/orders 处理了可选的 userId", must: "userId\\s*==\\s*null|isBlank\\s*\\(" },
            { label: "可选过滤时调了 getOrdersByUserId", must: "getOrdersByUserId\\s*\\(" },
            { label: "PATCH 用 valueOf 转 enum", must: "OrderStatus\\s*\\.\\s*valueOf" },
            { label: "PATCH 做了 toUpperCase（valueOf 大小写敏感）", must: "toUpperCase\\s*\\(" },
            { label: "PATCH 非法/缺失值返回 400", must: "BAD_REQUEST" },
            { label: "没有 try/catch EntityNotFoundException（该交给全局处理器）", mustNot: "catch\\s*\\(\\s*EntityNotFoundException" },
            { label: "打了日志", must: "logger\\.(info|debug)" },
            { label: "日志里带了 correlationId", must: "correlationId" },
          ],
          hints: [
            "先给六个端点各回答一个问题：「成功时有内容返回吗？」「是新建了资源吗？」这两个答案就决定了状态码。另外注意哪些异常你不该管。",
            "201 用 ResponseEntity.status(HttpStatus.CREATED).body(...)；204 用 ResponseEntity.noContent().build()。EntityNotFoundException 交给 GlobalExceptionHandler，不要 catch。PATCH 收的是 Map，没有 Bean Validation 保护，缺失和非法值都要自己挡成 400。",
            `getAllOrders: userId 为空（null 或 blank）→ getAllOrders()，否则 getOrdersByUserId(userId)，ok(...)
getOrderById: ok(orderService.getOrderById(id))   // 不 catch
getOrdersByUserId: ok(orderService.getOrdersByUserId(userId))
createOrder: status(CREATED).body(orderService.createOrder(request))
updateOrderStatus:
  raw = statusUpdate.get("status")
  raw 为空 → throw ResponseStatusException(BAD_REQUEST, ...)
  try { status = OrderStatus.valueOf(raw.trim().toUpperCase()) }
  catch (IllegalArgumentException) → throw ResponseStatusException(BAD_REQUEST, ...)
  ok(orderService.updateOrderStatus(id, status))
deleteOrder: orderService.deleteOrder(id); noContent().build()`,
            `// POST
return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));

// DELETE
orderService.deleteOrder(id);
return ResponseEntity.noContent().build();

// PATCH 的转换部分
final OrderStatus status;
try {
    status = OrderStatus.valueOf(raw.trim().toUpperCase());
} catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
}

// 日志
private String correlationId() { return MDC.get("correlationId"); }`,
          ],
          solution: real("java", CONTROLLER_SOLUTION, {
            filename: "参考答案（审计实测：mvn test 5/5 通过，BUILD SUCCESS）",
            collapsible: true,
          }),
        },
        {
          kind: "debug",
          id: "g-debug-404-swallowed",
          title: "Debug Lab · 查一个不存在的订单，返回了 200",
          level: 3,
          prompt: (
            <p>
              五个测试全过。但手动 curl 一个不存在的 id，
              得到 200 和一个空 body。期望是 404 加一段 JSON。
            </p>
          ),
          errorOutput: `$ curl -i -s localhost:8080/api/orders/999

HTTP/1.1 200
Content-Length: 0

# 期望：
# HTTP/1.1 404
# { "timestamp": "...", "status": 404, "message": "Order not found with id: 999" }

# mvn test：Tests run: 5, Failures: 0   ← 测试全过！`,
          broken: demo(
            "java",
            `@GetMapping("/api/orders/{id}")
public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
    logger.info("GET /api/orders/{} correlationId={}", id, correlationId());
    try {
        return ResponseEntity.ok(orderService.getOrderById(id));
    } catch (EntityNotFoundException ex) {
        return null;
    }
}`,
            { filename: "有问题的实现", highlight: [4, 6, 7] },
          ),
          classify: {
            options: [
              { id: "a", label: "状态码写错了 —— ok 该换成别的" },
              { id: "b", label: "异常处理错误 —— 自己 catch 掉了本该交给全局处理器的异常" },
              { id: "c", label: "路由错误 —— @PathVariable 没绑上" },
              { id: "d", label: "依赖注入错误 —— orderService 是 null" },
            ],
            answer: "b",
          },
          locate: {
            question: "该怎么改？",
            options: [
              { id: "a", label: "整个 try/catch 删掉，让异常冒出去给 GlobalExceptionHandler" },
              { id: "b", label: "catch 里改成 return ResponseEntity.notFound().build()" },
              { id: "c", label: "catch 里改成 throw new RuntimeException(ex)" },
              { id: "d", label: "把 @GetMapping 改成 @RequestMapping" },
            ],
            answer: "a",
          },
          fixed: real(
            "java",
            `@GetMapping("/api/orders/{id}")
public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
    logger.info("GET /api/orders/{} correlationId={}", id, correlationId());

    // 找不到时 service 抛 EntityNotFoundException，
    // 由 GlobalExceptionHandler 转成带 JSON 体的 404
    return ResponseEntity.ok(orderService.getOrderById(id));
}`,
            { filename: "改对之后（实测 5/5 通过）" },
          ),
          rootCause: (
            <>
              <p>
                项目里已经有 <code>@RestControllerAdvice</code> 标记的
                <code>GlobalExceptionHandler</code>，它专门把
                <code>EntityNotFoundException</code> 转成
                <strong>404 + 结构化 JSON 体</strong>。
              </p>
              <p>
                控制器自己 catch 掉之后，这个异常永远到不了全局处理器。
                <code>return null</code> 又让 Spring 给出 200 + 空 body ——
                <strong>404 变成了 200。</strong>
              </p>
              <p>
                <strong>选项 B 为什么也不够好？</strong>
                <code>ResponseEntity.notFound().build()</code> 状态码是对的（404），
                但<strong>响应体丢了</strong>。
                全局处理器返回的是
                <code>{"{ timestamp, status, message }"}</code>，
                客户端靠 message 定位问题。而且这等于重复实现了已有的能力 ——
                以后 404 的格式要改，就得改两处。
              </p>
              <p>
                <strong>通用原则：项目里有全局异常处理器时，
                控制器不要 try/catch</strong>，
                除非你要把某个异常转成<strong>不同的</strong>状态码
                （比如 PATCH 里把 <code>IllegalArgumentException</code>
                转成 400）。
              </p>
              <p>
                <strong>注意这个 bug 测试完全抓不到</strong>——
                测试里 <code>orderService</code> 是 mock 的，
                永远不会抛 <code>EntityNotFoundException</code>。
                只有手动 curl 才能发现。
              </p>
            </>
          ),
          verify:
            "mvn spring-boot:run，然后 curl -i localhost:8080/api/orders/999 应该得到 404 + JSON",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "java",
            `// ✗ POST 用了 ok()
return ResponseEntity.ok(orderService.createOrder(request));`,
          ),
          why: (
            <>
              创建资源应该返回 <strong>201 Created</strong>。
              这是被测试抓住的两个错之一：
              <code>Status expected:&lt;201&gt; but was:&lt;200&gt;</code>。
              <br />
              <code>ResponseEntity.ok()</code> 是肌肉记忆，
              写 REST 时要专门停一下问「这是创建吗？」
            </>
          ),
        },
        {
          wrong: demo(
            "java",
            `// ✗ DELETE 返回了 200
orderService.deleteOrder(id);
return ResponseEntity.ok().build();`,
          ),
          why: (
            <>
              删除成功没有内容可返回，标准是 <strong>204 No Content</strong>。
              <code>ResponseEntity.noContent().build()</code>。
              <br />
              判据很简单：<code>deleteOrder</code> 返回
              <code>void</code>，那就是 204。
            </>
          ),
        },
        {
          wrong: demo(
            "java",
            `// ✗ PATCH 直接 valueOf，没挡非法值
OrderStatus status = OrderStatus.valueOf(statusUpdate.get("status"));
return ResponseEntity.ok(orderService.updateOrderStatus(id, status));`,
          ),
          why: (
            <>
              两个问题：
              <br />
              ① body 是 <code>{"{}"}</code> 时 <code>get</code> 返回 null，
              <code>valueOf(null)</code> 抛 NPE → 500。
              <br />
              ② 传 <code>&quot;shipped&quot;</code>（小写）或
              <code>&quot;FLYING&quot;</code> 时抛
              <code>IllegalArgumentException</code> → 500。
              <br />
              两种都该是 <strong>400</strong>。
              <strong>测试查不到</strong>（它只发合法的 SHIPPED），
              但这是明显的正确性问题。
            </>
          ),
        },
        {
          wrong: demo(
            "java",
            `// ✗ 忽略了可选的 userId 参数
@GetMapping("/api/orders")
public ResponseEntity<List<Order>> getAllOrders(
        @RequestParam(required = false) String userId) {
    return ResponseEntity.ok(orderService.getAllOrders());   // userId 白收了
}`,
          ),
          why: (
            <>
              签名里有这个参数<strong>就是在要求你用它</strong>。
              TODO 原文还写了 <em>request validation</em>。
              <br />
              测试的 <code>get(&quot;/api/orders&quot;)</code> 不带参数，
              所以<strong>抓不到</strong>。
              但人工 review 会看到「收了一个参数却没用」。
            </>
          ),
        },
      ],
      transfer: [
        { signal: "创建成功", reachFor: "201 Created" },
        { signal: "service 方法返回 void", reachFor: "204 No Content + .build()" },
        { signal: "项目里有全局异常处理器", reachFor: "别 try/catch，让异常冒出去" },
        { signal: "要把某异常转成不同状态码", reachFor: "唯一该 try/catch 的场合，用 ResponseStatusException" },
        { signal: "收 Map 而不是 DTO 的端点", reachFor: "没有 Bean Validation 保护，自己挡 null 和非法值" },
        { signal: "签名里有个没用到的参数", reachFor: "那是提示：它要求你实现某个功能" },
      ],
      recap: [
        "六个端点全 return null 也能过 3/5 测试 —— Spring 里返回 null 会给出 200 + 空 body。",
        "201 Created 给 POST，204 No Content 给 DELETE，这是被测试抓住的两个点。",
        "EntityNotFoundException 交给 GlobalExceptionHandler，控制器里不要 catch。",
        "PATCH 收 Map 没有校验保护：null 和非法枚举值都要自己挡成 400，valueOf 大小写敏感。",
        "测试用 @MockBean 替换了 service，所以完全不验证业务逻辑 —— 必须手动 curl 自检。",
      ],
    },
  ],
};

/* ================================================================
   模块 5：两道书面题
   ================================================================ */

export const fedWritten: Module = {
  id: "fed-written",
  stage: "Federation · 第 5 部分",
  title: "书面题",
  summary:
    "QUESTIONS.md 里的两道题。它们不考代码，考的是「你有没有在真实系统里想过这些问题」。这一节给出思考框架和一份可以照着写的参考答案。",
  lessons: [
    {
      id: "g-written",
      title: "两道书面题：延迟传播与生产配置",
      blurb: "写代码的题有测试兜底，这两道题只有你自己。给你一套可复用的答题结构。",
      minutes: 22,
      objectives: [
        "解释联邦图里某个 subgraph 高延迟为什么会拖慢整体",
        "说出至少一种缓存策略，并说清它的失效策略和代价",
        "从一段 application.properties 里指出三个以上生产隐患",
        "掌握一个「风险 → 后果 → 修正 → 理由」的答题结构",
      ],
      whyForAssessment:
        "这两道题占的分不小，而且完全没有测试。很多人在这里写两句话就交了 —— 而它恰恰是最容易通过「结构化表达」拿分的地方。",
      sourceFiles: [
        {
          path: "graphql-federation-practice/QUESTIONS.md",
          role: "两道题的原文",
          edit: true,
        },
        {
          path: "graphql-federation-practice/java-service/src/main/resources/application.properties",
          role: "项目里真实的配置（和题面给的片段不完全一样）",
        },
      ],
      concepts: [
        {
          id: "answer-structure",
          heading: "先说答题结构",
          lede: "这两道题都能套同一个模板。",
          body: (
            <>
              <p>
                书面题的评分点通常是<strong>「有没有覆盖到关键面」</strong>，
                而不是文采。所以用固定结构写，最不容易漏：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>段</th>
                      <th>写什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>结论先行</strong></td>
                      <td>一句话给出核心判断，别铺垫</td>
                    </tr>
                    <tr>
                      <td><strong>机制</strong></td>
                      <td>为什么会这样 —— 讲清因果链，不只是现象</td>
                    </tr>
                    <tr>
                      <td><strong>方案</strong></td>
                      <td>具体做什么，最好带上配置或代码</td>
                    </tr>
                    <tr>
                      <td><strong>代价与边界</strong></td>
                      <td>
                        这个方案的代价是什么、什么时候不适用
                        —— <strong>这一段最能区分水平</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                最后那一段是关键。<strong>只说方案的人像是背过；
                能说出代价的人像是用过。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Written questions are usually scored on{" "}
                <strong>whether you covered the key angles</strong>, not on
                prose. So write to a fixed structure and you are least likely to
                miss one:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>What goes in it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Verdict first</strong></td>
                      <td>
                        One sentence with the core judgement. No warm-up.
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Mechanism</strong></td>
                      <td>
                        Why it happens — spell out the causal chain, not just the
                        symptom
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Fix</strong></td>
                      <td>
                        Exactly what to do, ideally with config or code
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Cost and limits</strong></td>
                      <td>
                        What the fix costs, when it does not apply —{" "}
                        <strong>this section separates the levels</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                That last section is the one that counts.{" "}
                <strong>
                  Someone who only lists the fix sounds memorised; someone who
                  can name the cost sounds like they have shipped it.
                </strong>
              </p>
            </>
          ),
        },
        {
          id: "q1-restate",
          heading: "第 1 题 · 题面与要点拆解",
          body: (
            <>
              <p>原文：</p>
              <p>
                题目要求两件事：
                <strong>① 解释影响</strong>（对依赖它的 subgraph）、
                <strong>② 给一种缓存策略</strong>缓解性能问题。
              </p>
              <p>
                注意题面用的词是 <em>dependent subgraphs</em>。
                这里有个需要说清的细节：
                <strong>subgraph 之间通常并不直接互相调用</strong>——
                它们都由 Router 编排。所以「影响」的准确传导路径是：
              </p>
              <p>
                <strong>能把这条路径说清楚，这道题就答对了一半。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>The original text:</p>
              <p>
                The question asks for two things:{" "}
                <strong>① explain the impact</strong> on the subgraphs that
                depend on it, and <strong>② give one caching strategy</strong> to
                take the edge off the performance hit.
              </p>
              <p>
                Note the wording: <em>dependent subgraphs</em>. There is a detail
                worth spelling out here —{" "}
                <strong>
                  subgraphs normally do not call each other directly
                </strong>
                . The Router orchestrates all of them. So the accurate path the
                impact travels is:
              </p>
              <p>
                <strong>
                  Explain that path clearly and you are already halfway to a full
                  answer.
                </strong>
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `## Question 1: Apollo Federation Architecture

Given a scenario where the User subgraph is experiencing high latency
(500ms+ response times), explain how this impacts dependent subgraphs
in a federated graph and describe one caching strategy to mitigate the
performance impact.`,
              {
                filename: "QUESTIONS.md（第 1 题原文）",
                sourceFile: "graphql-federation-practice/QUESTIONS.md",
              },
            ),
            real(
              "text",
              `User subgraph 慢（500ms+）
   ↓
Router 的查询计划里，「取 User 的 @key 字段」这一步是前置依赖
   ↓
Router 必须先拿到 { __typename: "User", id } 才能去问 Orders subgraph
   ↓ 所以这两步是串行的，不能并行
Orders subgraph 即使自己只要 10ms，也要等到 500ms 之后才被调用
   ↓
客户端看到的总延迟 ≈ 500 + 10 + Router 开销
   ↓
更糟的连锁：Router 的连接池 / 线程被长时间占用
   ↓ 一个慢 subgraph 拖住整个 Router 的吞吐
所有查询（哪怕完全不碰 User）都开始变慢`,
              { filename: "影响的传导路径" },
            ),
          ],
        },
        {
          id: "q1-answer",
          heading: "第 1 题 · 一份可以照着写的答案",
          lede: "这是 DrillLab 写的参考答案，不是官方标准答案。",
          body: (
            <>
              <p>
                下面这份按「结论 → 机制 → 方案 → 代价」写。
                <strong>标为 DrillLab 自出</strong>——
                原项目的 <code>QUESTIONS.md</code> 里答案区是空的
                （<code>[Write answer here]</code>），
                没有官方答案可对照。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The answer below follows verdict → mechanism → fix → cost. It is{" "}
                <strong>marked as written by DrillLab</strong>: the answer area in
                the original <code>QUESTIONS.md</code> is empty (
                <code>[Write answer here]</code>), so there is no official answer
                to compare against.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `**结论**

User subgraph 的高延迟不会「只影响 User 字段」。因为 Router 的查询计划里，
取 User 的 @key 字段是解析其他 subgraph 上 User 扩展字段（如 Orders 的
User.orders）的前置步骤，这两步必须串行。因此任何涉及 User 的查询，
其尾延迟都会被抬到 500ms 以上；更严重的是 Router 侧的连接与线程被长时间
占用，会波及完全不碰 User 的查询。

**机制**

1. 查询计划分阶段。Router 先向 Accounts subgraph 请求 User 及其 @key
   字段（id），拿到 entity representation 后，才能向 Orders subgraph 发
   _entities(representations: [{ __typename: "User", id }]) 请求。
   后者依赖前者的输出，无法并行。
2. 串行相加。总延迟 ≈ Accounts(500ms) + Orders(10ms) + Router 编排开销。
   Orders 自身再快也无法改善。
3. 资源放大。Router 到 Accounts 的连接在 500ms 内一直占用。QPS 上升时，
   按 Little's Law（并发数 ≈ 到达率 × 停留时间），所需并发是原来的数十倍。
   连接池耗尽后，排队开始，其他 subgraph 的请求也被拖慢 —— 一个慢服务
   放大成全图退化。
4. 超时与部分失败。如果 Router 配了 subgraph 超时，500ms 会触发超时，
   User 相关字段变成 null 并带 errors，客户端拿到部分数据。

**缓解方案：在 Router 层做 entity 缓存**

对 User 这类「变化不频繁、被大量引用」的 entity，在 Router 与 Accounts
之间加一层按 entity key 分片的缓存（Apollo Router 的 entity caching，
后端用 Redis）：

- 缓存键：subgraph 名 + __typename + @key 字段值 + 请求的字段集合。
  例如 accounts:User:id=123:{name,email}。
- 命中时跳过对 Accounts 的网络调用，串行的第一段从 500ms 降到 ~1ms。
- TTL 按数据容忍度设定。用户资料这类数据 60–300s 是合理起点。
- 主动失效：Accounts 在用户资料变更时向缓存发删除指令（write-through
  或 event-driven invalidation），避免只依赖 TTL 造成的陈旧窗口。
- 配合 stale-while-revalidate：过期后先返回旧值、后台异步刷新，
  把「缓存过期」这一刻的延迟尖刺也削掉。

**代价与边界**

- 一致性变弱。TTL 内会读到旧数据。所以只适合能容忍秒级陈旧的字段；
  余额、权限、库存这类不能这么做。
- 缓存键必须包含字段集合，否则不同查询会互相污染。
- 必须按调用者身份分片，否则会跨用户泄漏（这是安全问题，不只是正确性）。
- 缓存治标不治本。命中率不会是 100%，冷启动和长尾 key 仍然吃 500ms。
  真正的修复是查 Accounts 慢在哪（N+1、缺索引、下游依赖），
  缓存只是买时间。
- 其他值得同时做的：给 subgraph 请求设超时和熔断，避免慢服务拖垮 Router；
  用 APQ（automatic persisted queries）减小请求体；
  对高频组合查询考虑在 Router 前加响应级缓存。`,
              {
                filename: "第 1 题参考答案（DrillLab 自出）",
                collapsible: true,
              },
            ),
          ],
        },
        {
          id: "q2-restate",
          heading: "第 2 题 · 题面与那段配置",
          body: (
            <>
              <p>
                题目给了一段部署到 AWS EKS 的
                <code>application.properties</code>，
                要求指出<strong>至少三个</strong>生产/安全问题，
                每个都说明风险并给出修正配置与理由。
              </p>
              <p>
                <strong>注意题面给的片段和项目里真实的文件不一样。</strong>
                项目里那个只有三行：
              </p>
              <p>
                题面给的片段多了数据源和口令占位符。
                <strong>答题时以题面为准。</strong>
                但注意项目真实文件里那行
                <code>management.endpoints.web.exposure.include=*</code>
                是两边都有的 —— 这是最明显的问题。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The question hands you an{" "}
                <code>application.properties</code> destined for AWS EKS and asks
                you to name <strong>at least three</strong> production or
                security problems, each with the risk, a corrected config, and
                the reasoning.
              </p>
              <p>
                <strong>
                  Careful: the snippet in the question is not the same as the real
                  file in the project.
                </strong>{" "}
                The real one is three lines long:
              </p>
              <p>
                The snippet in the question adds a datasource and password
                placeholders.{" "}
                <strong>Answer against the question, not the repo.</strong> But
                notice that the line{" "}
                <code>management.endpoints.web.exposure.include=*</code> appears
                in both — that is the most obvious problem of the lot.
              </p>
            </>
          ),
          code: [
            real(
              "properties",
              `server.port=8080
server.address=0.0.0.0
spring.datasource.url=jdbc:postgresql://\${DB_HOST}:5432/orders
spring.datasource.username=\${DB_USER}
spring.datasource.password=\${DB_PASSWORD}
management.endpoints.web.exposure.include=*`,
              {
                filename: "QUESTIONS.md 里给的片段",
                sourceFile: "graphql-federation-practice/QUESTIONS.md",
              },
            ),
            real(
              "properties",
              `server.port=8080
server.address=0.0.0.0
management.endpoints.web.exposure.include=*`,
              {
                filename: "项目里真实的 application.properties（全文）",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/resources/application.properties",
                explanation:
                  "只有三行，没有数据源配置 —— 因为这个项目用的是内存仓库。这也再次印证 orders.db 是干扰项。",
              },
            ),
          ],
        },
        {
          id: "q2-checklist",
          heading: "第 2 题 · 找问题的清单",
          lede: "按这几个面扫一遍，三个问题很容易凑够，而且不会漏掉重要的。",
          body: (
            <>
              <ol>
                <li>
                  <strong>暴露面。</strong>哪些端点被公开了？
                  actuator 全开是最典型的问题。
                </li>
                <li>
                  <strong>凭据管理。</strong>口令从哪来？
                  环境变量算及格，但不算好。
                </li>
                <li>
                  <strong>传输安全。</strong>有 TLS 吗？
                  数据库连接加密了吗？
                </li>
                <li>
                  <strong>资源与韧性。</strong>连接池、超时、重试、
                  优雅停机 —— 一个都没配。
                </li>
                <li>
                  <strong>可观测性。</strong>健康检查分不分
                  liveness / readiness? 日志格式适合采集吗？
                </li>
                <li>
                  <strong>配置管理本身。</strong>
                  所有环境共用一个 properties 文件？
                  没有 profile 隔离？
                </li>
              </ol>
              <p>
                <strong>题目只要三个，但列五六个更好</strong>——
                只要每个都写清「风险 → 修正 → 理由」，
                不会因为写多而扣分。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>Exposure.</strong> Which endpoints are public? Actuator
                  wide open is the classic one.
                </li>
                <li>
                  <strong>Credentials.</strong> Where does the password come
                  from? An environment variable is a pass, not a good grade.
                </li>
                <li>
                  <strong>Transport security.</strong> Is there TLS? Is the
                  database connection encrypted?
                </li>
                <li>
                  <strong>Resources and resilience.</strong> Connection pool,
                  timeouts, retries, graceful shutdown — not one of them is
                  configured.
                </li>
                <li>
                  <strong>Observability.</strong> Does the health check split
                  liveness from readiness? Is the log format fit for collection?
                </li>
                <li>
                  <strong>Config management itself.</strong> One properties file
                  for every environment? No profile separation?
                </li>
              </ol>
              <p>
                <strong>
                  The question asks for three, but five or six is better
                </strong>{" "}
                — as long as each one spells out risk → fix → reasoning, nobody
                deducts points for writing more.
              </p>
            </>
          ),
        },
        {
          id: "q2-answer",
          heading: "第 2 题 · 一份可以照着写的答案",
          body: (
            <>
              <p>
                同样按结构写，每个问题一小节。
                下面列了六个，前三个是最该写的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Same structure again, one short section per problem. Six are
                listed below; the first three are the ones you really must write.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `### 问题 1（最严重）：actuator 端点全量暴露

management.endpoints.web.exposure.include=*

**风险**：这一行把所有 actuator 端点开在业务端口上，包括
- /actuator/env —— 打印全部环境变量，DB_PASSWORD 直接泄漏
- /actuator/heapdump —— 可下载堆转储，内存里的凭据和用户数据全在里面
- /actuator/configprops、/actuator/beans —— 暴露完整内部结构
- /actuator/loggers —— 可写，攻击者能改日志级别（掩盖痕迹或打爆磁盘）
在 EKS 里如果这个 Service 挂了 Ingress，等于把这些开到公网。

**修正**
management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.health.show-details=never
management.endpoint.health.probes.enabled=true
management.server.port=8081
management.endpoints.web.base-path=/internal

**理由**：白名单代替通配符（默认拒绝）；管理端点搬到独立端口 8081，
Ingress 只暴露 8080，运维流量走集群内部；health 不显示细节，
避免泄漏下游拓扑；probes.enabled 分出 liveness/readiness 供 k8s 探针用。


### 问题 2：数据库口令的管理方式

spring.datasource.password=\${DB_PASSWORD}

**风险**：占位符本身没错，但它把问题推给了「谁来设这个环境变量」。
在 EKS 里常见做法是 ConfigMap 或 Deployment 的 env —— 而这两者
kubectl describe 就能看到明文，会进 etcd（默认不加密）、
会被 CI 日志打出来、会随 Deployment yaml 进版本库。
而且环境变量对同 Pod 内所有进程和 /proc/PID/environ 可见。

**修正**
- 用 AWS Secrets Manager + External Secrets Operator，或
  Secrets Store CSI Driver，把口令以文件形式挂进容器，
  用 spring.config.import=optional:file:/mnt/secrets/ 读取
- 打开 RDS IAM 认证，用短期 token 替代静态口令（最优）
- 开启自动轮换，配合 HikariCP 的 max-lifetime 让连接自然更新
- 给 Pod 配最小权限的 IRSA 角色

**理由**：静态长期口令是最难治的一类风险 —— 一旦泄漏无法追溯、
轮换成本高。挂载文件优于环境变量（不进 /proc/environ、不被子进程继承）；
IAM 认证彻底消除静态凭据。


### 问题 3：没有 TLS，数据库连接也未加密

**风险**：server.port=8080 是纯 HTTP；JDBC URL 没有 sslmode 参数。
即使在 VPC 内，明文流量也违反多数合规要求（PCI-DSS、HIPAA），
且无法防御同 VPC 内的横向嗅探。

**修正**
spring.datasource.url=jdbc:postgresql://\${DB_HOST}:5432/orders?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-ca.pem
server.forward-headers-strategy=framework

**理由**：应用侧 TLS 通常在 Ingress 或 service mesh（mTLS）终止，
所以 8080 保持 HTTP 是可接受的架构选择 —— 但必须显式说明前面有
TLS 终止层，并配 forward-headers-strategy 让应用正确识别原始协议
（否则重定向会掉回 http）。数据库侧 sslmode=verify-full 强制加密并校验
证书，防中间人。


### 问题 4：连接池、超时、重试全部缺失

**风险**：用默认值上生产等于没有容量规划。下游变慢时连接池耗尽，
线程全部阻塞在等连接，健康检查也超时，k8s 反复重启 Pod —— 雪崩。

**修正**
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.validation-timeout=1000
spring.mvc.async.request-timeout=5000

**理由**：池大小要按「DB 最大连接数 ÷ 副本数」倒推，不是越大越好；
connection-timeout 短一点，让请求快速失败而不是排队等死
（fail fast 比 fail slow 好）；max-lifetime 小于数据库侧的
idle timeout，避免用到已被服务端关闭的连接。


### 问题 5：没有优雅停机

**风险**：EKS 滚动更新时 Pod 收到 SIGTERM 就立刻断开，
正在处理的请求被截断，客户端看到 502。

**修正**
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s

**理由**：graceful 让容器停止接收新请求但把在途请求处理完。
超时值要小于 k8s 的 terminationGracePeriodSeconds（默认 30s），
否则会被 SIGKILL 打断。


### 问题 6：单份配置、无环境隔离

**风险**：同一个 properties 文件用于 dev/staging/prod，
改一处影响所有环境；本地调试用的宽松设置会带到生产。

**修正**：拆成 application.yml（公共）+ application-prod.yml，
用 SPRING_PROFILES_ACTIVE=prod 激活；敏感项一律走外部 Secret，
不进镜像。CI 里加一步「生产 profile 配置校验」。

**理由**：配置是部署产物的一部分，需要和代码一样做审查与分环境管理。`,
              {
                filename: "第 2 题参考答案（DrillLab 自出）",
                collapsible: true,
              },
            ),
          ],
        },
        {
          id: "how-to-write",
          heading: "写这两道题时的几条实操建议",
          body: (
            <>
              <ul>
                <li>
                  <strong>给出可以粘贴的配置。</strong>
                  「应该限制 actuator 暴露」和
                  <code>management.endpoints.web.exposure.include=health,info</code>
                  是两个水平。
                </li>
                <li>
                  <strong>按严重性排序。</strong>
                  把 actuator 全开放在第一个 —— 它是唯一能直接
                  导致口令泄漏的。评分的人可能只认真看前两条。
                </li>
                <li>
                  <strong>承认某些「问题」其实是合理设计。</strong>
                  <code>server.address=0.0.0.0</code> 在容器里
                  <strong>是必须的</strong>（不然 Pod 外面连不上）。
                  把它当成安全问题反而暴露了对容器网络的不理解。
                  <strong>能指出「这一条不是问题」是加分的。</strong>
                </li>
                <li>
                  <strong>每条都写「理由」。</strong>
                  题目原文明确要求 <em>with justification</em>。
                  只给配置不给理由会丢分。
                </li>
                <li>
                  <strong>别写空话。</strong>
                  「要遵循最佳实践」「要加强安全意识」这类句子零分，
                  而且会稀释真正有内容的部分。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <ul>
                <li>
                  <strong>Give config someone can paste.</strong>{" "}
                  &ldquo;Actuator exposure should be restricted&rdquo; and{" "}
                  <code>management.endpoints.web.exposure.include=health,info</code>{" "}
                  are two different grades.
                </li>
                <li>
                  <strong>Order by severity.</strong> Put actuator wide open
                  first — it is the only one that leaks the password outright.
                  Whoever grades this may only read the first two carefully.
                </li>
                <li>
                  <strong>
                    Admit when a &ldquo;problem&rdquo; is actually sound design.
                  </strong>{" "}
                  <code>server.address=0.0.0.0</code> is{" "}
                  <strong>required</strong> inside a container — without it
                  nothing outside the Pod can connect. Calling it a security
                  issue advertises that you do not understand container
                  networking.{" "}
                  <strong>
                    Pointing out &ldquo;this one is not a problem&rdquo; earns
                    credit.
                  </strong>
                </li>
                <li>
                  <strong>Give reasoning for every item.</strong> The question
                  says <em>with justification</em> in so many words. Config with
                  no reasoning loses marks.
                </li>
                <li>
                  <strong>No filler.</strong> Sentences like &ldquo;follow best
                  practices&rdquo; and &ldquo;improve security awareness&rdquo;
                  score zero, and they dilute the parts that have substance.
                </li>
              </ul>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-written-worst",
          title: "哪一行是最严重的安全问题",
          level: 1,
          prompt: (
            <p>
              题面给的六行配置里，哪一行能<strong>直接</strong>
              导致数据库口令泄漏？
            </p>
          ),
          code: real(
            "properties",
            `server.port=8080
server.address=0.0.0.0
spring.datasource.url=jdbc:postgresql://\${DB_HOST}:5432/orders
spring.datasource.username=\${DB_USER}
spring.datasource.password=\${DB_PASSWORD}
management.endpoints.web.exposure.include=*`,
            { sourceFile: "graphql-federation-practice/QUESTIONS.md" },
          ),
          options: [
            { id: "a", label: "server.address=0.0.0.0" },
            { id: "b", label: "spring.datasource.password=${DB_PASSWORD}" },
            { id: "c", label: "management.endpoints.web.exposure.include=*" },
            { id: "d", label: "server.port=8080" },
          ],
          answer: ["c"],
          explain: (
            <>
              <code>include=*</code> 把<strong>所有</strong> actuator
              端点开在业务端口上，其中 <code>/actuator/env</code>
              会打印全部环境变量 —— <code>DB_PASSWORD</code> 明文可见；
              <code>/actuator/heapdump</code> 更彻底，
              整个堆内存都能下载。
              <br />
              B 用占位符<strong>本身是对的</strong>（比硬编码好），
              问题在于「谁来设这个变量」，属于凭据管理层面的问题，
              不是这一行本身。
              <br />
              <strong>A 在容器里是必须的</strong>——
              不绑 0.0.0.0，Pod 外面根本连不上。
              <strong>把它当成安全问题会暴露对容器网络的不理解。</strong>
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-written-serial",
          title: "为什么 User subgraph 慢会拖慢 Orders subgraph",
          level: 1,
          prompt: (
            <p>
              客户端查{" "}
              <code>{"{ user(id:\"1\") { name orders { id } } }"}</code>。
              Accounts subgraph 要 500ms，Orders subgraph 只要 10ms。
              总延迟大约是多少，为什么？
            </p>
          ),
          options: [
            { id: "a", label: "约 500ms —— 两个 subgraph 并行请求，取最慢的那个" },
            { id: "b", label: "约 510ms —— Router 必须先拿到 User 的 id 才能去问 Orders，两步串行" },
            { id: "c", label: "约 10ms —— Orders 有缓存" },
            { id: "d", label: "约 250ms —— 平均值" },
          ],
          answer: ["b"],
          explain: (
            <>
              Router 的查询计划里，这两步<strong>有依赖关系</strong>：
              要向 Orders 发
              <code>_entities(representations: [{'{ __typename: "User", id }'}])</code>，
              必须先从 Accounts 拿到那个 <code>id</code>。
              <strong>所以不能并行。</strong>
              <br />
              A 的情况只在「两个 subgraph 的字段互不依赖」时成立
              （比如同时查 <code>user</code> 和 <code>topProducts</code>）。
              <br />
              这个「串行依赖」就是第 1 题要你解释的核心机制。
            </>
          ),
        },
        {
          kind: "code-completion",
          id: "g-written-fix",
          title: "写出 actuator 那一条的修正配置",
          level: 3,
          prompt: (
            <p>
              针对 <code>management.endpoints.web.exposure.include=*</code>，
              写出修正后的配置。至少要做到：白名单、管理端口分离、
              health 不泄漏细节、支持 k8s 探针。
            </p>
          ),
          generated: true,
          language: "properties",
          filename: "application-prod.properties",
          starter: `# 修正 management.endpoints.web.exposure.include=*
# 要求：
#   1. 用白名单代替 *
#   2. 管理端点挪到独立端口
#   3. health 不显示下游细节
#   4. 支持 k8s 的 liveness / readiness 探针

`,
          requirements: [
            "用白名单列出需要的端点，不用 *",
            "management.server.port 设成与业务端口不同的值",
            "health 端点不显示详情",
            "开启 health probes（liveness / readiness）",
          ],
          checks: [
            {
              label: "用了白名单（include 后面不是 *）",
              must: "management\\.endpoints\\.web\\.exposure\\.include\\s*=\\s*[a-z]",
            },
            { label: "没有留下 include=*", mustNot: "exposure\\.include\\s*=\\s*\\*" },
            { label: "至少暴露了 health", must: "include[^\\n]*health" },
            { label: "管理端点挪到了独立端口", must: "management\\.server\\.port\\s*=" },
            {
              label: "health 不显示详情",
              must: "management\\.endpoint\\.health\\.show-details\\s*=\\s*never",
            },
            {
              label: "开启了 k8s 探针支持",
              must: "management\\.endpoint\\.health\\.probes\\.enabled\\s*=\\s*true",
            },
          ],
          hints: [
            "先问：actuator 里哪些端点是运维真的需要的？除了这几个，其余都该关。另外想一想：如果管理端点和业务端点在同一个端口，Ingress 能把它们分开吗？",
            "四个配置项：exposure.include（白名单）、management.server.port（独立端口）、endpoint.health.show-details、endpoint.health.probes.enabled。",
            `management.endpoints.web.exposure.include=需要的几个端点，逗号分隔
management.endpoint.health.show-details=never
management.endpoint.health.probes.enabled=true
management.server.port=另一个端口
（可选）management.endpoints.web.base-path=/internal`,
            `management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.health.show-details=never
management.endpoint.health.probes.enabled=true
management.server.port=8081`,
          ],
          solution: demo(
            "properties",
            `# 白名单代替通配符：默认拒绝，只开运维真正需要的
management.endpoints.web.exposure.include=health,info,prometheus

# health 不显示下游细节，避免泄漏内部拓扑与依赖状态
management.endpoint.health.show-details=never

# 分出 liveness / readiness，供 k8s 探针分别使用
# （liveness 失败会重启 Pod，readiness 失败只是摘流量 —— 语义不同，必须分开）
management.endpoint.health.probes.enabled=true

# 管理端点搬到独立端口，Ingress 只暴露 8080，运维流量走集群内部
management.server.port=8081
management.endpoints.web.base-path=/internal

# 顺带：优雅停机，滚动更新时不截断在途请求
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s`,
            {
              filename: "参考答案（DrillLab 自出）",
              explanation:
                "关键是「默认拒绝」这个思路：白名单而不是黑名单。另外 probes.enabled 那一条很多人不知道 —— liveness 和 readiness 的语义完全不同，共用一个 health 端点会导致「下游数据库抖动一下，Pod 被重启」这种事故。",
            },
          ),
        },
      ],
      transfer: [
        { signal: "「某个服务慢了会怎样」", reachFor: "先找串行依赖，再讲资源放大" },
        { signal: "「给一种缓存策略」", reachFor: "缓存键 + TTL + 失效策略 + 一致性代价，四件套" },
        { signal: "审查配置", reachFor: "六个面：暴露 / 凭据 / 传输 / 资源韧性 / 可观测 / 配置管理" },
        { signal: "看到 include=*", reachFor: "白名单代替通配符，默认拒绝" },
        { signal: "看到 0.0.0.0 就想报警", reachFor: "容器里这是必须的，别当成问题" },
        { signal: "书面题要求 justification", reachFor: "每条都写理由，只给配置会丢分" },
      ],
      recap: [
        "答题结构：结论 → 机制 → 方案 → 代价与边界。最后一段最能区分水平。",
        "第 1 题的核心是「Router 的查询计划里 @key 那一步是前置依赖，所以串行」。",
        "缓存答案要包含四件事：缓存键、TTL、主动失效、一致性代价。",
        "第 2 题按六个面扫：暴露面 / 凭据 / 传输 / 资源韧性 / 可观测性 / 配置管理。",
        "actuator 全开是最严重的（/actuator/env 直接泄漏口令）；server.address=0.0.0.0 在容器里不是问题。",
      ],
    },
  ],
};
