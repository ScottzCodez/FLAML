from langchain.chat_models import ChatOpenAI, AzureChatOpenAI
from langchain.agents import initialize_agent
from langchain.agents import AgentType
from langchain.tools.python.tool import PythonREPLTool
from langchain.agents.agent_toolkits import create_python_agent
from flaml.autogen.math_utils import eval_math_responses, get_answer
from utils import remove_asy_sections


class ReAct:
    def __init__(self, config_list, use_azure) -> None:
        config_list = config_list[0]
        if not use_azure:
            self.llm = ChatOpenAI(model_name=config_list['model'], openai_api_key=config_list['api_key'])
        else:
            self.llm = AzureChatOpenAI(
                deployment_name=config_list['model'],
                openai_api_base=config_list['api_base'],
                openai_api_version=config_list['api_version'],
                openai_api_key=config_list['api_key'],
            )
        tools = [PythonREPLTool()]
        self.agent = initialize_agent(tools, self.llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True)

        # # https://python.langchain.com/docs/integrations/toolkits/python
        # self.agent = create_python_agent(
        #     llm=self.llm,
        #     tool=PythonREPLTool(),
        #     verbose=True,
        #     agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        # )

    def solve_one_problem(self, problem):
        result = None
        while result is None:
            result = self._solve(problem)

        return {
            # must have
            "response_with_ans": result,
            "correct_ans": get_answer(problem["solution"]),
        }

    def _solve(self, problem):
        try:
            result = self.agent.run(
                remove_asy_sections(problem["problem"])
                + "\n\n(When you write code, use 'print' function for the output)"
            )
        except:
            result = None

        return result