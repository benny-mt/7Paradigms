-- ============================================================
Calculadora en lenguaje funcional ELM
Generada por Claude.ai
-- ============================================================

module Calculator exposing (main)

import Browser
import Html exposing (Html, div, button, text, span)
import Html.Attributes exposing (class, id)
import Html.Events exposing (onClick)


-- ---- MODEL ----
-- All state lives here. No mutation — update returns a new Model.

type Operator = Add | Sub | Mul | Div

type alias Model =
    { display   : String      -- what the user sees
    , stored    : Float       -- the left-hand operand
    , operator  : Maybe Operator
    , waitNext  : Bool        -- true if next digit starts a fresh number
    }

init : Model
init =
    { display  = "0"
    , stored   = 0
    , operator = Nothing
    , waitNext = False
    }


-- ---- MESSAGES ----

type Msg
    = Digit String
    | Dot
    | Op Operator
    | Equals
    | Clear
    | ToggleSign
    | Percent


-- ---- UPDATE ----
-- Pure function: (Msg, Model) → Model. No side effects whatsoever.

update : Msg -> Model -> Model
update msg model =
    case msg of
        Digit d ->
            if model.waitNext then
                { model | display = d, waitNext = False }
            else if model.display == "0" then
                { model | display = d }
            else if String.length model.display < 12 then
                { model | display = model.display ++ d }
            else
                model

        Dot ->
            if model.waitNext then
                { model | display = "0.", waitNext = False }
            else if String.contains "." model.display then
                model
            else
                { model | display = model.display ++ "." }

        Op op ->
            let
                current = Maybe.withDefault 0 (String.toFloat model.display)
                newStored =
                    case model.operator of
                        Nothing -> current
                        Just prevOp ->
                            if model.waitNext then model.stored
                            else compute model.stored current prevOp
            in
            { model
            | stored   = newStored
            , operator = Just op
            , display  = String.fromFloat newStored
            , waitNext = True
            }

        Equals ->
            case model.operator of
                Nothing -> model
                Just op ->
                    let
                        current = Maybe.withDefault 0 (String.toFloat model.display)
                        result  = compute model.stored current op
                    in
                    { model
                    | display  = formatResult result
                    , stored   = result
                    , operator = Nothing
                    , waitNext = True
                    }

        Clear ->
            init

        ToggleSign ->
            let
                current = Maybe.withDefault 0 (String.toFloat model.display)
            in
            { model | display = formatResult (current * -1) }

        Percent ->
            let
                current = Maybe.withDefault 0 (String.toFloat model.display)
            in
            { model | display = formatResult (current / 100) }


-- Pure helper: applies an operator to two floats
compute : Float -> Float -> Operator -> Float
compute a b op =
    case op of
        Add -> a + b
        Sub -> a - b
        Mul -> a * b
        Div -> if b == 0 then 0 else a / b


-- Pure helper: clean up float display (remove trailing .0)
formatResult : Float -> String
formatResult n =
    let s = String.fromFloat n
    in if String.endsWith ".0" s then String.dropRight 2 s else s


-- ---- VIEW ----
-- Pure function: Model → Html Msg. Purely declarative.

view : Model -> Html Msg
view model =
    div [ class "calc-wrapper" ]
        [ div [ class "calc" ]
            [ div [ class "paradigm-label" ] [ text "Functional Paradigm · Elm" ]
            , div [ class "display" ]
                [ span [ class "display-text" ] [ text (truncateDisplay model.display) ]
                ]
            , div [ class "buttons" ]
                [ row [ btnGray "C" Clear,   btnGray "+/-" ToggleSign, btnGray "%" Percent, btnOp "÷" Div model ]
                , row [ btnNum "7",           btnNum "8",               btnNum "9",          btnOp "×" Mul model ]
                , row [ btnNum "4",           btnNum "5",               btnNum "6",          btnOp "−" Sub model ]
                , row [ btnNum "1",           btnNum "2",               btnNum "3",          btnOp "+" Add model ]
                , row [ btnWide "0",          btnDot,                                        btnEquals ]
                ]
            ]
        ]


truncateDisplay : String -> String
truncateDisplay s =
    if String.length s > 12 then String.left 12 s ++ "…" else s


-- Button helpers
row : List (Html Msg) -> Html Msg
row btns = div [ class "btn-row" ] btns

btnNum : String -> Html Msg
btnNum d = button [ class "btn btn-num", onClick (Digit d) ] [ text d ]

btnGray : String -> Msg -> Html Msg
btnGray label msg = button [ class "btn btn-gray", onClick msg ] [ text label ]

btnOp : String -> Operator -> Model -> Html Msg
btnOp label op model =
    let
        isActive = model.operator == Just op
        cls = if isActive then "btn btn-op active" else "btn btn-op"
    in
    button [ class cls, onClick (Op op) ] [ text label ]

btnWide : String -> Html Msg
btnWide d = button [ class "btn btn-num btn-wide", onClick (Digit d) ] [ text d ]

btnDot : Html Msg
btnDot = button [ class "btn btn-num", onClick Dot ] [ text "." ]

btnEquals : Html Msg
btnEquals = button [ class "btn btn-eq", onClick Equals ] [ text "=" ]


-- ---- MAIN ----

main : Program () Model Msg
main =
    Browser.sandbox
        { init   = init
        , update = update
        , view   = view
        }
