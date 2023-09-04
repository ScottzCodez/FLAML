# AutoGen: Enabling Next-Gen GPT-X Applications

`flaml.autogen` simplifies the orchestration, automation and optimization of a complex GPT-X workflow. It maximizes the performance of GPT-X models and augments their weakness. It enables building next-gen GPT-X applications based on multi-agent conversations with minimal effort.

## Features

* A unified multi-agent conversation framework as a high-level abstraction of using foundation models. It offers customizable and conversable agents which integrate LLM, tool and human.
By automating chat among multiple capable agents, one can easily make them collectively perform tasks autonomously or with human feedback, including tasks that require using tools via code.
* A drop-in replacement of `openai.Completion` or `openai.ChatCompletion` as an enhanced inference API. It allows easy performance tuning, utilities like API unification & caching, and advanced usage patterns, such as error handling, multi-config inference, context programming etc.

The package is under active development with more features upcoming.

## Agents

[`flaml.autogen.agentchat`](/docs/reference/autogen/agentchat/agent) offers a multi-agent conversation framework, featuring capable, customizable and conversable agents which integrate LLM, tool and human via automated agent chat.

### Basic Concept

We have designed a generic `ResponsiveAgent` class for Agents that are capable of conversing with each other through the exchange of messages to jointly finish a task. An agent can communicate with other agents and perform actions. Different agents can differ in what actions they perform after receiving messages. Two representative subclasses are `AssistantAgent` and `UserProxyAgent`.

- `AssistantAgent`. Designed to act as an assistant by responding to user requests. It could write Python code (in a Python coding block) for a user to execute when a message (typically a description of a task that needs to be solved) is received. Under the hood, the Python code is written by LLM (e.g., GPT-4). It can also receive the execution results and suggest code with bug fix. Its behavior can be altered by passing a new system message. The LLM [inference](#enhanced-inference) configuration can be configured via `llm_config`.
- `UserProxyAgent`. Serves as a proxy for the human user. Upon receiving a message, the UserProxyAgent will either solicit the human user's input or prepare an automatically generated reply. The chosen action depends on the settings of the `human_input_mode` and `max_consecutive_auto_reply` when the `UserProxyAgent` instance is constructed, and whether a human user input is available.
By default, the automatically generated reply is crafted based on automatic code execution. The `UserProxyAgent` triggers code execution automatically when it detects an executable code block in the received message and no human user input is provided. Code execution can be disabled by setting `code_execution_config` to False. LLM-based response is disabled by default. It can be enabled by setting `llm_config` to a dict corresponding to the [inference](#enhanced-inference) configuration.
When `llm_config` is set to a dict, `UserProxyAgent` can generate replies using an LLM when code execution is not performed.

The auto-reply capability of `ResponsiveAgent` allows for more autonomous multi-agent communication while retaining the possibility of human intervention.
One can also easily extend it by registering auto_reply functions with the `register_auto_reply()` method.

### Basic Example

Example usage of the agents to solve a task with code:
```python
from flaml.autogen import AssistantAgent, UserProxyAgent

# create an AssistantAgent instance named "assistant"
assistant = AssistantAgent(name="assistant")

# create a UserProxyAgent instance named "user_proxy"
user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",  # in this mode, the agent will never solicit human input but always auto reply
)

# the assistant receives a message from the user, which contains the task description
user.initiate_chat(
    assistant,
    message="""What date is today? Which big tech stock has the largest year-to-date gain this year? How much is the gain?""",
)
```
In the example above, we create an AssistantAgent named "assistant" to serve as the assistant and a UserProxyAgent named "user_proxy" to serve as a proxy for the human user.
1. The assistant receives a message from the user_proxy, which contains the task description.
2. The assistant then tries to write Python code to solve the task and sends the response to the user_proxy.
3. Once the user_proxy receives a response from the assistant, it tries to reply by either soliciting human input or preparing an automatically generated reply. In this specific example, since `human_input_mode` is set to `"NEVER"`, the user_proxy will not solicit human input but send an automatically generated reply (auto reply). More specifically, the user_proxy executes the code and uses the result as the auto-reply.
4. The assistant then generates a further response for the user_proxy. The user_proxy can then decide whether to terminate the conversation. If not, steps 3 and 4 are repeated.

Please find a visual illustration of how UserProxyAgent and AssistantAgent collaboratively solve the above task below:
![Agent Chat Example](images/agent_example.png)

### Human Input Mode

The `human_input_mode` parameter of `UserProxyAgent` controls the behavior of the agent when it receives a message. It can be set to `"NEVER"`, `"ALWAYS"`, or `"TERMINATE"`.
- Under the mode `human_input_mode="NEVER"`, the multi-turn conversation between the assistant and the user_proxy stops when the number of auto-reply reaches the upper limit specified by `max_consecutive_auto_reply` or the received message is a termination message according to `is_termination_msg`.
- When `human_input_mode` is set to `"ALWAYS"`, the user proxy agent solicits human input every time a message is received; and the conversation stops when the human input is "exit", or when the received message is a termination message and no human input is provided.
- When `human_input_mode` is set to `"TERMINATE"`, the user proxy agent solicits human input only when a termination message is received or the number of auto replies reaches `max_consecutive_auto_reply`.

### Function Calling
To leverage [function calling capability of OpenAI's Chat Completions API](https://openai.com/blog/function-calling-and-other-api-updates?ref=upstract.com), one can pass in a list of callable functions or class methods to `UserProxyAgent`, which corresponds to the description of functions passed to OpenAI's API.

Example usage of the agents to solve a task with function calling feature:
```python
from flaml.autogen import AssistantAgent, UserProxyAgent

# put the descriptions of functions in config to be passed to OpenAI's API
llm_config = {
    "model": "gpt-4-0613",
    "functions": [
        {
            "name": "python",
            "description": "run cell in ipython and return the execution result.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cell": {
                        "type": "string",
                        "description": "Valid Python cell to execute.",
                    }
                },
                "required": ["cell"],
            },
        },
        {
            "name": "sh",
            "description": "run a shell script and return the execution result.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": "Valid shell script to execute.",
                    }
                },
                "required": ["script"],
            },
        },
    ],
}

# create an AssistantAgent instance named "assistant"
chatbot = AssistantAgent("assistant", **llm_config)

# create a UserProxyAgent instance named "user_proxy"
user_proxy = UserProxyAgent(
    "user_proxy",
    human_input_mode="NEVER",
)

# define functions according to the function desription
from IPython import get_ipython

def exec_python(cell):
    ipython = get_ipython()
    result = ipython.run_cell(cell)
    log = str(result.result)
    if result.error_before_exec is not None:
        log += f"\n{result.error_before_exec}"
    if result.error_in_exec is not None:
        log += f"\n{result.error_in_exec}"
    return log

def exec_sh(script):
    return user_proxy.execute_code_blocks([("sh", script)])

# register the functions
user_proxy.register_function(
    function_map={
        "python": exec_python,
        "sh": exec_sh,
    }
)

# start the conversation
user_proxy.initiate_chat(
    chatbot,
    message="Draw two agents chatting with each other with an example dialog.",
)
```

### Notebook Examples
<!-- Keep aligned with notebooks in docs/Examples/AutoGen-AgentChat.md -->

*Interested in trying it yourself? Please check the following notebook examples:*
* [Automated Task Solving with Code Generation, Execution & Debugging](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_auto_feedback_from_code_execution.ipynb)
* [Auto Code Generation, Execution, Debugging and Human Feedback](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_human_feedback.ipynb)
* [Solve Tasks Requiring Web Info](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_web_info.ipynb)
* [Use Provided Tools as Functions](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_function_call.ipynb)
* [Automated Task Solving with Coding & Planning Agents](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_planning.ipynb)
* [Automated Task Solving with GPT-4 + Multiple Human Users](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_two_users.ipynb)
* [Automated Chess Game Playing & Chitchatting by GPT-4 Agents](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_chess.ipynb)
* [Automated Task Solving by Group Chat](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_groupchat.ipynb)
* [Automated Continual Learning from New Data](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_stream.ipynb)
* [Automated Code Generation and Question Answering with Retrieval Augemented Agents](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_agentchat_RetrieveChat.ipynb)

## Enhanced Inference

One can use [`flaml.autogen.Completion.create`](/docs/reference/autogen/oai/completion#create) to perform inference.
There are a number of benefits of using `autogen` to perform inference: performance tuning, API unification, caching, error handling, multi-config inference, result filtering, templating and so on.

### Tune Inference Parameters

*Links to notebook examples:*
* [Optimize for Code Generation](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_openai_completion.ipynb)
* [Optimize for Math](https://github.com/microsoft/FLAML/blob/main/notebook/autogen_chatgpt_gpt4.ipynb)

#### Choices to optimize

The cost of using foundation models for text generation is typically measured in terms of the number of tokens in the input and output combined. From the perspective of an application builder using foundation models, the use case is to maximize the utility of the generated text under an inference budget constraint (e.g., measured by the average dollar cost needed to solve a coding problem). This can be achieved by optimizing the hyperparameters of the inference,
which can significantly affect both the utility and the cost of the generated text.

The tunable hyperparameters include:
1. model - this is a required input, specifying the model ID to use.
1. prompt/messages - the input prompt/messages to the model, which provides the context for the text generation task.
1. max_tokens - the maximum number of tokens (words or word pieces) to generate in the output.
1. temperature - a value between 0 and 1 that controls the randomness of the generated text. A higher temperature will result in more random and diverse text, while a lower temperature will result in more predictable text.
1. top_p - a value between 0 and 1 that controls the sampling probability mass for each token generation. A lower top_p value will make it more likely to generate text based on the most likely tokens, while a higher value will allow the model to explore a wider range of possible tokens.
1. n - the number of responses to generate for a given prompt. Generating multiple responses can provide more diverse and potentially more useful output, but it also increases the cost of the request.
1. stop - a list of strings that, when encountered in the generated text, will cause the generation to stop. This can be used to control the length or the validity of the output.
1. presence_penalty, frequency_penalty - values that control the relative importance of the presence and frequency of certain words or phrases in the generated text.
1. best_of - the number of responses to generate server-side when selecting the "best" (the one with the highest log probability per token) response for a given prompt.

The cost and utility of text generation are intertwined with the joint effect of these hyperparameters.
There are also complex interactions among subsets of the hyperparameters. For example,
the temperature and top_p are not recommended to be altered from their default values together because they both control the randomness of the generated text, and changing both at the same time can result in conflicting effects; n and best_of are rarely tuned together because if the application can process multiple outputs, filtering on the server side causes unnecessary information loss; both n and max_tokens will affect the total number of tokens generated, which in turn will affect the cost of the request.
These interactions and trade-offs make it difficult to manually determine the optimal hyperparameter settings for a given text generation task.

*Do the choices matter? Check this [blogpost](/blog/2023/04/21/LLM-tuning-math) to find example tuning results about gpt-3.5-turbo and gpt-4.*


With `flaml.autogen`, the tuning can be performed with the following information:
1. Validation data.
1. Evaluation function.
1. Metric to optimize.
1. Search space.
1. Budgets: inference and optimization respectively.

#### Validation data

Collect a diverse set of instances. They can be stored in an iterable of dicts. For example, each instance dict can contain "problem" as a key and the description str of a math problem as the value; and "solution" as a key and the solution str as the value.

#### Evaluation function

The evaluation function should take a list of responses, and other keyword arguments corresponding to the keys in each validation data instance as input, and output a dict of metrics. For example,

```python
def eval_math_responses(responses: List[str], solution: str, **args) -> Dict:
    # select a response from the list of responses
    answer = voted_answer(responses)
    # check whether the answer is correct
    return {"success": is_equivalent(answer, solution)}
```

[`flaml.autogen.code_utils`](/docs/reference/autogen/code_utils) and [`flaml.autogen.math_utils`](/docs/reference/autogen/math_utils) offer some example evaluation functions for code generation and math problem solving.

#### Metric to optimize

The metric to optimize is usually an aggregated metric over all the tuning data instances. For example, users can specify "success" as the metric and "max" as the optimization mode. By default, the aggregation function is taking the average. Users can provide a customized aggregation function if needed.

#### Search space

Users can specify the (optional) search range for each hyperparameter.

1. model. Either a constant str, or multiple choices specified by `flaml.tune.choice`.
1. prompt/messages. Prompt is either a str or a list of strs, of the prompt templates. messages is a list of dicts or a list of lists, of the message templates.
Each prompt/message template will be formatted with each data instance. For example, the prompt template can be:
"{problem} Solve the problem carefully. Simplify your answer as much as possible. Put the final answer in \\boxed{{}}."
And `{problem}` will be replaced by the "problem" field of each data instance.
1. max_tokens, n, best_of. They can be constants, or specified by `flaml.tune.randint`, `flaml.tune.qrandint`, `flaml.tune.lograndint` or `flaml.qlograndint`. By default, max_tokens is searched in [50, 1000); n is searched in [1, 100); and best_of is fixed to 1.
1. stop. It can be a str or a list of strs, or a list of lists of strs or None. Default is None.
1. temperature or top_p. One of them can be specified as a constant or by `flaml.tune.uniform` or `flaml.tune.loguniform` etc.
Please don't provide both. By default, each configuration will choose either a temperature or a top_p in [0, 1] uniformly.
1. presence_penalty, frequency_penalty. They can be constants or specified by `flaml.tune.uniform` etc. Not tuned by default.

#### Budgets

One can specify an inference budget and an optimization budget.
The inference budget refers to the average inference cost per data instance.
The optimization budget refers to the total budget allowed in the tuning process. Both are measured by dollars and follow the price per 1000 tokens.

#### Perform tuning

Now, you can use [`flaml.autogen.Completion.tune`](/docs/reference/autogen/oai/completion#tune) for tuning. For example,

```python
from flaml import autogen

config, analysis = autogen.Completion.tune(
    data=tune_data,
    metric="success",
    mode="max",
    eval_func=eval_func,
    inference_budget=0.05,
    optimization_budget=3,
    num_samples=-1,
)
```

`num_samples` is the number of configurations to sample. -1 means unlimited (until optimization budget is exhausted).
The returned `config` contains the optimized configuration and `analysis` contains an [ExperimentAnalysis](/docs/reference/tune/analysis#experimentanalysis-objects) object for all the tried configurations and results.

The tuend config can be used to perform inference.

### API unification

`flaml.autogen.Completion.create` is compatible with both `openai.Completion.create` and `openai.ChatCompletion.create`, and both OpenAI API and Azure OpenAI API. So models such as "text-davinci-003", "gpt-3.5-turbo" and "gpt-4" can share a common API.
When chat models are used and `prompt` is given as the input to `flaml.autogen.Completion.create`, the prompt will be automatically converted into `messages` to fit the chat completion API requirement. One advantage is that one can experiment with both chat and non-chat models for the same prompt in a unified API.

For local LLMs, one can spin up an endpoint using a package like [simple_ai_server](https://github.com/lhenault/simpleAI) and [FastChat](https://github.com/lm-sys/FastChat), and then use the same API to send a request. See [here](/blog/2023/07/14/Local-LLMs) for examples on how to make inference with local LLMs.

When only working with the chat-based models, `flaml.autogen.ChatCompletion` can be used. It also does automatic conversion from prompt to messages, if prompt is provided instead of messages.

### Caching

API call results are cached locally and reused when the same request is issued. This is useful when repeating or continuing experiments for reproducibility and cost saving. It still allows controlled randomness by setting the "seed", using [`set_cache`](/docs/reference/autogen/oai/completion#set_cache) or specifying in `create()`.

### Error handling

#### Runtime error

It is easy to hit error when calling OpenAI APIs, due to connection, rate limit, or timeout. Some of the errors are transient. `flaml.autogen.Completion.create` deals with the transient errors and retries automatically. Initial request timeout, retry timeout and retry time interval can be configured via `request_timeout`, `retry_timeout` and `flaml.autogen.Completion.retry_time`.

Moreover, one can pass a list of configurations of different models/endpoints to mitigate the rate limits. For example,

```python
response = autogen.Completion.create(
    config_list=[
        {
            "model": "gpt-4",
            "api_key": os.environ.get("AZURE_OPENAI_API_KEY"),
            "api_type": "azure",
            "api_base": os.environ.get("AZURE_OPENAI_API_BASE"),
            "api_version": "2023-06-01-preview",
        },
        {
            "model": "gpt-3.5-turbo",
            "api_key": os.environ.get("OPENAI_API_KEY"),
            "api_type": "open_ai",
            "api_base": "https://api.openai.com/v1",
            "api_version": None,
        },
        {
            "model": "llama-7B",
            "api_base": "http://127.0.0.1:8080",
            "api_type": "open_ai",
            "api_version": None,
        }
    ],
    prompt="Hi",
)
```

It will try querying Azure OpenAI gpt-4, OpenAI gpt-3.5-turbo, and a locally hosted llama-7B one by one, ignoring AuthenticationError, RateLimitError and Timeout,
until a valid result is returned. This can speed up the development process where the rate limit is a bottleneck. An error will be raised if the last choice fails. So make sure the last choice in the list has the best availability.

#### Logic error

Another type of error is that the returned response does not satisfy a requirement. For example, if the response is required to be a valid json string, one would like to filter the responses that are not. This can be achieved by providing a list of configurations and a filter function. For example,

```python
def valid_json_filter(context, config, response):
    for text in autogen.Completion.extract_text(response):
        try:
            json.loads(text)
            return True
        except ValueError:
            pass
    return False

response = autogen.Completion.create(
    config_list=[{"model": "text-ada-001"}, {"model": "gpt-3.5-turbo"}, {"model": "text-davinci-003"}],
    prompt="How to construct a json request to Bing API to search for 'latest AI news'? Return the JSON request.",
    filter_func=valid_json_filter,
)
```

The example above will try to use text-ada-001, gpt-3.5-turbo, and text-davinci-003 iteratively, until a valid json string is returned or the last config is used. One can also repeat the same model in the list for multiple times to try one model multiple times for increasing the robustness of the final response.

*Advanced use case: Check this [blogpost](/blog/2023/05/18/GPT-adaptive-humaneval) to find how to improve GPT-4's coding performance from 68% to 90% while reducing the inference cost.*

### Templating

If the provided prompt or message is a template, it will be automatically materialized with a given context. For example,

```python
response = autogen.Completion.create(
    context={"problem": "How many positive integers, not exceeding 100, are multiples of 2 or 3 but not 4?"},
    prompt="{problem} Solve the problem carefully.",
    allow_format_str_template=True,
    **config
)
```

A template is either a format str, like the example above, or a function which produces a str from several input fields, like the example below.

```python
def content(turn, context):
    return "\n".join(
        [
            context[f"user_message_{turn}"],
            context[f"external_info_{turn}"]
        ]
    )

messages = [
    {
        "role": "system",
        "content": "You are a teaching assistant of math.",
    },
    {
        "role": "user",
        "content": partial(content, turn=0),
    },
]
context = {
    "user_message_0": "Could you explain the solution to Problem 1?",
    "external_info_0": "Problem 1: ...",
}

response = autogen.ChatCompletion.create(context, messages=messages, **config)
messages.append(
    {
        "role": "assistant",
        "content": autogen.ChatCompletion.extract_text(response)[0]
    }
)
messages.append(
    {
        "role": "user",
        "content": partial(content, turn=1),
    },
)
context.append(
    {
        "user_message_1": "Why can't we apply Theorem 1 to Equation (2)?",
        "external_info_1": "Theorem 1: ...",
    }
)
response = autogen.ChatCompletion.create(context, messages=messages, **config)
```

### Logging (Experimental)

When debugging or diagnosing an LLM-based system, it is often convenient to log the API calls and analyze them. `flaml.autogen.Completion` and `flaml.autogen.ChatCompletion` offer an easy way to collect the API call histories. For example, to log the chat histories, simply run:
```python
flaml.autogen.ChatCompletion.start_logging()
```
The API calls made after this will be automatically logged. They can be retrieved at any time by:
```python
flaml.autogen.ChatCompletion.logged_history
```
To stop logging, use
```python
flaml.autogen.ChatCompletion.stop_logging()
```
If one would like to append the history to an existing dict, pass the dict like:
```python
flaml.autogen.ChatCompletion.start_logging(history_dict=existing_history_dict)
```
By default, the counter of API calls will be reset at `start_logging()`. If no reset is desired, set `reset_counter=False`.

There are two types of logging formats: compact logging and individual API call logging. The default format is compact.
Set `compact=False` in `start_logging()` to switch.

* Example of a history dict with compact logging.
```python
{
    """
    [
        {
            'role': 'system',
            'content': system_message,
        },
        {
            'role': 'user',
            'content': user_message_1,
        },
        {
            'role': 'assistant',
            'content': assistant_message_1,
        },
        {
            'role': 'user',
            'content': user_message_2,
        },
        {
            'role': 'assistant',
            'content': assistant_message_2,
        },
    ]""": {
        "created_at": [0, 1],
        "cost": [0.1, 0.2],
    }
}
```

* Example of a history dict with individual API call logging.
```python
{
    0: {
        "request": {
            "messages": [
                {
                    "role": "system",
                    "content": system_message,
                },
                {
                    "role": "user",
                    "content": user_message_1,
                }
            ],
            ... # other parameters in the request
        },
        "response": {
            "choices": [
                "messages": {
                    "role": "assistant",
                    "content": assistant_message_1,
                },
            ],
            ... # other fields in the response
        }
    },
    1: {
        "request": {
            "messages": [
                {
                    "role": "system",
                    "content": system_message,
                },
                {
                    "role": "user",
                    "content": user_message_1,
                },
                {
                    "role": "assistant",
                    "content": assistant_message_1,
                },
                {
                    "role": "user",
                    "content": user_message_2,
                },
            ],
            ... # other parameters in the request
        },
        "response": {
            "choices": [
                "messages": {
                    "role": "assistant",
                    "content": assistant_message_2,
                },
            ],
            ... # other fields in the response
        }
    },
}
```
It can be seen that the individual API call history contains redundant information of the conversation. For a long conversation the degree of redundancy is high.
The compact history is more efficient and the individual API call history contains more details.

### Other Utilities

- a [`cost`](/docs/reference/autogen/oai/completion#cost) function to calculate the cost of an API call.
- a [`test`](/docs/reference/autogen/oai/completion#test) function to conveniently evaluate the configuration over test data.
- an [`extract_text_or_function_call`](/docs/reference/autogen/oai/completion#extract_text_or_function_call) function to extract the text or function call from a completion or chat response.


## Utilities for Applications

### Code

[`flaml.autogen.code_utils`](/docs/reference/autogen/code_utils) offers code-related utilities, such as:
- a [`improve_code`](/docs/reference/autogen/code_utils#improve_code) function to improve code for a given objective.
- a [`generate_assertions`](/docs/reference/autogen/code_utils#generate_assertions) function to generate assertion statements from function signature and docstr.
- a [`implement`](/docs/reference/autogen/code_utils#implement) function to implement a function from a definition.
- a [`eval_function_completions`](/docs/reference/autogen/code_utils#eval_function_completions) function to evaluate the success of a function completion task, or select a response from a list of responses using generated assertions.

### Math

[`flaml.autogen.math_utils`](/docs/reference/autogen/math_utils) offers utilities for math problems, such as:
- a [eval_math_responses](/docs/reference/autogen/math_utils#eval_math_responses) function to select a response using voting, and check if the final answer is correct if the canonical solution is provided.

## For Further Reading

*Interested in the research that leads to this package? Please check the following papers.*
* [Cost-Effective Hyperparameter Optimization for Large Language Model Generation Inference](https://arxiv.org/abs/2303.04673). Chi Wang, Susan Xueqing Liu, Ahmed H. Awadallah. ArXiv preprint arXiv:2303.04673 (2023).
* [An Empirical Study on Challenging Math Problem Solving with GPT-4](https://arxiv.org/abs/2306.01337). Yiran Wu, Feiran Jia, Shaokun Zhang, Hangyu Li, Erkang Zhu, Yue Wang, Yin Tat Lee, Richard Peng, Qingyun Wu, Chi Wang. ArXiv preprint arXiv:2306.01337 (2023).
* [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation Framework](https://arxiv.org/abs/2308.08155). Qingyun Wu, Gagan Bansal, Jieyu Zhang, Yiran Wu, Shaokun Zhang, Erkang Zhu, Beibin Li, Li Jiang, Xiaoyun Zhang, Chi Wang. ArXiv preprint arXiv:2308.08155 (2023).