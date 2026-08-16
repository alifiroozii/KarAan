import { AppError } from "@/lib/errors";
import {
  StateMachineService,
  ShiftAssignmentState as AssignmentState,
} from "@/modules/state-machine/state-machine.service";

export type { AssignmentState };

export class AssignmentStateMachine {
  public static canTransition(currentState: AssignmentState, nextState: AssignmentState): boolean {
    return new StateMachineService().canTransitionAssignment(currentState, nextState);
  }

  public static assertCanTransition(currentState: AssignmentState, nextState: AssignmentState): void {
    if (!this.canTransition(currentState, nextState)) {
      throw new AppError(
        `تغییر وضعیت نامعتبر از ${currentState} به ${nextState}`,
        "INVALID_STATE_TRANSITION",
        400,
        { currentState, nextState }
      );
    }
  }
}
