import os
from flaml import oai

KEY_LOC = "test/autogen"
here = os.path.abspath(os.path.dirname(__file__))


def test_create_execute_script(human_input_mode="NEVER", max_consecutive_auto_reply=10):
    try:
        import openai
    except ImportError:
        return
    from flaml.autogen.agent.assistant_agent import AssistantAgent
    from flaml.autogen.agent.user_proxy_agent import UserProxyAgent

    config_list = oai.config_list_gpt4_gpt35(key_file_path=KEY_LOC)
    conversations = {}
    oai.ChatCompletion.start_logging(conversations)
    agent = AssistantAgent("coding_agent", request_timeout=600, seed=42, config_list=config_list)
    user = UserProxyAgent(
        "user",
        human_input_mode=human_input_mode,
        max_consecutive_auto_reply=max_consecutive_auto_reply,
        is_termination_msg=lambda x: x.rstrip().endswith("TERMINATE"),
    )
    agent.receive(
        """Create and execute a script to plot a rocket without using matplotlib""",
        user,
    )
    agent.reset()
    agent.receive(
        """Create a temp.py file with the following content:
```
print('Hello world!')
```""",
        user,
    )
    print(conversations)
    oai.ChatCompletion.start_logging(compact=False)
    agent.receive("""Execute temp.py""", user)
    print(oai.ChatCompletion.logged_history)
    oai.ChatCompletion.stop_logging()


def test_tsp(human_input_mode="NEVER", max_consecutive_auto_reply=10):
    try:
        import openai
    except ImportError:
        return
    from flaml.autogen.agent.assistant_agent import AssistantAgent
    from flaml.autogen.agent.user_proxy_agent import UserProxyAgent

    config_list = oai.config_list_openai_aoai(key_file_path=KEY_LOC)
    hard_questions = [
        "What if we must go from node 1 to node 2?",
        "Can we double all distances?",
        "Can we add a new point to the graph? It's distance should be randomly between 0 - 5 to each of the existing points.",
    ]

    oai.ChatCompletion.start_logging()
    agent = AssistantAgent("coding_agent", temperature=0, config_list=config_list)
    user = UserProxyAgent(
        "user",
        work_dir=f"{here}",
        human_input_mode=human_input_mode,
        max_consecutive_auto_reply=max_consecutive_auto_reply,
    )
    with open(f"{here}/tsp_prompt.txt", "r") as f:
        prompt = f.read()
    # agent.receive(prompt.format(question=hard_questions[0]), user)
    # agent.receive(prompt.format(question=hard_questions[1]), user)
    agent.receive(prompt.format(question=hard_questions[2]), user)
    print(oai.ChatCompletion.logged_history)
    oai.ChatCompletion.stop_logging()


if __name__ == "__main__":
    test_create_execute_script(human_input_mode="TERMINATE")
    # when GPT-4, i.e., the DEFAULT_MODEL, is used, conversation in the following test
    # should terminate in 2-3 rounds of interactions (because is_termination_msg should be true after 2-3 rounds)
    # although the max_consecutive_auto_reply is set to 10.
    test_tsp(human_input_mode="NEVER", max_consecutive_auto_reply=10)