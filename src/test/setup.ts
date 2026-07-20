import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library no limpia solo salvo que vitest corra con `globals`, y sin
// esto cada test hereda el DOM del anterior.
afterEach(cleanup);
