# The Mule's Court - Godot 4.5 Migration Guide

**This document serves as both a migration roadmap and a CLAUDE.md-style guide for Claude Code when building The Mule's Court in Godot Engine 4.5.**

## Why Godot for This Project?

After struggling with PixiJS and BabylonJS rendering engines in a React environment, Godot offers several compelling advantages:

### Built for Games, Not Adapted from Web Tech
- **Native game development workflow** - No fighting with web rendering engines
- **Visual scene editor** - Drag-and-drop UI building instead of CSS battles
- **Built-in animation system** - AnimationPlayer and tweens out of the box
- **2D rendering optimized for games** - Not 3D engines adapted for 2D

### Simplified Architecture
- **Scene-based composition** - Natural fit for card game entities
- **Signal-based events** - Cleaner than React state management for game events
- **Resource system** - Card data as custom resources, not JSON
- **Autoload singletons** - Simple global state management

### Development Experience
- **Instant visual feedback** - Editor shows changes immediately
- **Integrated debugging** - Breakpoints, inspector, remote debugging
- **Export to multiple platforms** - Desktop, web, mobile from one codebase
- **No build configuration hell** - No webpack, vite, babel, etc.

## Project Overview

**The Mule's Court** is a 2-4 player card game based on Isaac Asimov's Foundation universe, featuring:
- 16 unique cards with special abilities
- Phase-based gameplay (setup → draw → play → round-end)
- Deduction, risk, and elimination mechanics
- First to N devotion tokens wins (7 for 2p, 5 for 3p, 4 for 4p)

## Prerequisites

### Required Software
```bash
# Download Godot 4.5 (or latest stable 4.x)
# https://godotengine.org/download

# Install Git (for version control)
# Already using GitButler, so this should be configured

# Optional: GDScript LSP for VS Code/your editor
# https://github.com/godotengine/godot-vscode-plugin
```

### System Requirements
- Godot 4.5 stable (confirmed compatible with 4.4+)
- Git (GitButler-managed repository)
- Modern GPU with OpenGL 3.3+ or Vulkan support

## Quick Start

### 1. Create New Godot Project
```bash
# Create project directory
mkdir the-mules-court-godot
cd the-mules-court-godot

# Initialize Git (GitButler compatible)
git init

# Create .gitignore for Godot
cat > .gitignore << 'EOF'
# Godot 4+ specific ignores
.godot/
.import/
export.cfg
export_presets.cfg

# Imported translations (automatically generated from CSV)
*.translation

# Mono-specific ignores
.mono/
data_*/
mono_crash.*.json

# OS/Editor specific
.DS_Store
*.swp
*.swo
*~
.vscode/
.idea/
EOF
```

### 2. Project Structure (Godot Convention)
```
the-mules-court-godot/
├── .godot/                 # Auto-generated, NEVER commit
├── assets/                 # All game assets
│   ├── cards/             # Card portraits
│   │   ├── informant/
│   │   ├── han-pritcher/
│   │   └── ...
│   ├── ui/                # UI sprites/themes
│   └── audio/             # Sound effects, music
├── scenes/                # All .tscn scene files
│   ├── main.tscn         # Entry point
│   ├── game_board.tscn   # Main game scene
│   ├── card/
│   │   ├── card.tscn     # Reusable card scene
│   │   └── card.gd       # Card logic script
│   ├── player/
│   │   ├── player_area.tscn
│   │   └── player_area.gd
│   └── ui/
│       ├── player_select.tscn
│       └── game_hud.tscn
├── scripts/               # Standalone scripts
│   ├── autoload/         # Singleton scripts
│   │   ├── game_manager.gd
│   │   └── card_database.gd
│   ├── resources/        # Custom resource types
│   │   └── card_data.gd
│   └── utils/            # Helper functions
│       └── deck_utils.gd
├── tests/                # Unit tests (using GUT or gdUnit4)
│   └── unit/
│       └── test_game_manager.gd
└── project.godot         # Project configuration
```

## Architecture Design

### Core Philosophy: Scene-Based Components

Godot uses **scenes** as the fundamental building block. Unlike React components, scenes are:
- Self-contained node hierarchies
- Reusable through instancing
- Composable (scenes can contain other scenes)
- Editable visually in the Godot editor

### Scene Hierarchy for The Mule's Court

```
Main (Node)
└── GameBoard (Control)
    ├── CenterArea (VBoxContainer)
    │   ├── DeckDisplay (TextureRect)
    │   ├── DiscardDisplay (TextureRect)
    │   └── PhaseLabel (Label)
    ├── PlayersContainer (GridContainer)
    │   ├── PlayerArea1 (Scene Instance)
    │   ├── PlayerArea2 (Scene Instance)
    │   ├── PlayerArea3 (Scene Instance)
    │   └── PlayerArea4 (Scene Instance)
    └── GameHUD (CanvasLayer)
        ├── DevotionDisplay (HBoxContainer)
        └── ControlButtons (HBoxContainer)
```

### Key Godot Concepts Mapped to React Patterns

| React Pattern | Godot Equivalent | Example |
|---------------|------------------|---------|
| `useState` | Node properties with `@export` | `@export var devotion_tokens: int = 0` |
| `useEffect` | `_ready()`, `_process()` lifecycle | `func _ready(): initialize_player()` |
| Props drilling | Node references via `get_node()` or `@onready` | `@onready var deck = $Deck` |
| Event handlers | Signals | `signal card_played(card: Card)` |
| Context API | Autoload singletons | `GameManager.current_phase` |
| Custom hooks | Utility scripts | `DeckUtils.shuffle(cards)` |

## Core Systems Implementation

### 1. Card System

**Card as a Custom Resource** (`scripts/resources/card_data.gd`):
```gdscript
class_name CardData
extends Resource

enum CardType {
    INFORMANT,
    HAN_PRITCHER,
    BAIL_CHANNIS,
    EBLING_MIS,
    MAGNIFICO,
    SHIELDED_MIND,
    BAYTA_DARELL,
    TORAN_DARELL,
    MAYOR_INDBUR,
    FIRST_SPEAKER,
    MULE
}

@export var card_type: CardType
@export var value: int
@export var card_name: String
@export var ability: String
@export var color: Color
@export var icon: String
@export var quote: String
@export var description: String
@export var portrait: Texture2D  # Preloaded image

# Unique instance ID (generated when added to deck)
var instance_id: String = ""

func _init(
    p_type: CardType = CardType.INFORMANT,
    p_value: int = 1,
    p_name: String = "Informant"
):
    card_type = p_type
    value = p_value
    card_name = p_name
```

**Card Scene** (`scenes/card/card.tscn` + `card.gd`):
```gdscript
class_name Card
extends Control

signal clicked(card: Card)
signal played(card: Card)

@export var card_data: CardData
@onready var portrait_rect: TextureRect = $Portrait
@onready var name_label: Label = $CardName
@onready var value_label: Label = $Value

func _ready():
    if card_data:
        update_display()

func update_display():
    portrait_rect.texture = card_data.portrait
    name_label.text = card_data.card_name
    value_label.text = str(card_data.value)
    modulate = card_data.color

func _on_gui_input(event: InputEvent):
    if event is InputEventMouseButton:
        if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
            clicked.emit(self)
```

### 2. Game State Management (Autoload Singleton)

**GameManager** (`scripts/autoload/game_manager.gd`):
```gdscript
extends Node

# Signals for state changes
signal phase_changed(new_phase: Phase)
signal player_eliminated(player_id: String)
signal round_ended(winner_id: String)
signal game_ended(winner_id: String)

enum Phase {
    SETUP,
    DRAW,
    PLAY,
    ROUND_END,
    GAME_END
}

# Game state variables
var players: Array[Player] = []
var deck: Array[CardData] = []
var current_player_index: int = 0
var current_phase: Phase = Phase.SETUP
var tokens_to_win: int = 4
var removed_card: CardData = null

func initialize_game(player_count: int):
    """Initialize new game with specified player count"""
    players.clear()
    tokens_to_win = _get_tokens_to_win(player_count)

    # Create players
    for i in range(player_count):
        var player = Player.new()
        player.id = "player_%d" % i
        player.name = "Player %d" % (i + 1)
        players.append(player)

    # Initialize first round
    initialize_round()
    current_phase = Phase.DRAW
    phase_changed.emit(current_phase)

func initialize_round():
    """Set up a new round"""
    deck = CardDatabase.create_deck()
    deck = _shuffle_deck(deck)

    # Remove cards based on player count
    if players.size() == 2:
        # Remove 3 cards: 1 face-up, 2 face-down
        removed_card = deck.pop_back()
        deck.pop_back()
        deck.pop_back()
    elif players.size() == 3:
        # Remove 1 card face-down
        deck.pop_back()

    # Reset player states
    for player in players:
        player.hand.clear()
        player.discard_pile.clear()
        player.is_protected = false
        player.is_eliminated = false

    # Deal 1 card to each player
    for player in players:
        player.hand.append(deck.pop_back())

func draw_card():
    """Current player draws a card (draw phase)"""
    if current_phase != Phase.DRAW or deck.is_empty():
        return

    var current_player = players[current_player_index]
    var drawn_card = deck.pop_back()
    current_player.hand.append(drawn_card)

    current_phase = Phase.PLAY
    phase_changed.emit(current_phase)

    # Check for First Speaker auto-discard
    _check_first_speaker_auto_discard(current_player)

func play_card(card_instance_id: String, choice: Dictionary = {}):
    """Play a card from current player's hand"""
    if current_phase != Phase.PLAY:
        return

    var current_player = players[current_player_index]
    var card_index = -1

    for i in current_player.hand.size():
        if current_player.hand[i].instance_id == card_instance_id:
            card_index = i
            break

    if card_index == -1:
        return

    var played_card = current_player.hand[card_index]
    current_player.hand.remove_at(card_index)
    current_player.discard_pile.append(played_card)

    # Clear protection from other players
    for player in players:
        if player.id != current_player.id:
            player.is_protected = false

    # Apply card effect
    CardEffects.apply_effect(self, played_card, current_player.id, choice)

    # Check for First Speaker auto-discard after effect
    _check_first_speaker_auto_discard(current_player)

func end_turn():
    """End current player's turn and check win conditions"""
    var active_players = players.filter(func(p): return not p.is_eliminated)

    # Check win conditions
    if active_players.size() == 1:
        _handle_round_end(active_players[0].id)
        return

    if deck.is_empty():
        var winner = _determine_winner(active_players)
        _handle_round_end(winner.id)
        return

    # Move to next player
    current_player_index = _get_next_player_index()
    current_phase = Phase.DRAW
    phase_changed.emit(current_phase)

func _get_tokens_to_win(player_count: int) -> int:
    match player_count:
        2: return 7
        3: return 5
        4: return 4
        _: return 4

func _shuffle_deck(cards: Array[CardData]) -> Array[CardData]:
    var shuffled = cards.duplicate()
    shuffled.shuffle()
    return shuffled

func _get_next_player_index() -> int:
    var next = (current_player_index + 1) % players.size()
    while players[next].is_eliminated:
        next = (next + 1) % players.size()
    return next

func _handle_round_end(winner_id: String):
    for player in players:
        if player.id == winner_id:
            player.devotion_tokens += 1
            round_ended.emit(winner_id)

            if player.devotion_tokens >= tokens_to_win:
                current_phase = Phase.GAME_END
                game_ended.emit(winner_id)
            else:
                current_phase = Phase.ROUND_END

            phase_changed.emit(current_phase)
            return

func _determine_winner(active_players: Array[Player]) -> Player:
    var highest_value = 0
    var tied_players: Array[Player] = []

    for player in active_players:
        var hand_value = player.hand[0].value if player.hand.size() > 0 else 0
        if hand_value > highest_value:
            highest_value = hand_value
            tied_players = [player]
        elif hand_value == highest_value:
            tied_players.append(player)

    if tied_players.size() == 1:
        return tied_players[0]

    # Tiebreaker: discard pile total
    var highest_discard = 0
    var winner = tied_players[0]
    for player in tied_players:
        var discard_total = 0
        for card in player.discard_pile:
            discard_total += card.value
        if discard_total > highest_discard:
            highest_discard = discard_total
            winner = player

    return winner

func _check_first_speaker_auto_discard(player: Player):
    # Check if player has First Speaker + (Indbur or Darell)
    var has_first_speaker = false
    var has_conflict = false

    for card in player.hand:
        if card.card_type == CardData.CardType.FIRST_SPEAKER:
            has_first_speaker = true
        if card.card_type in [
            CardData.CardType.MAYOR_INDBUR,
            CardData.CardType.BAYTA_DARELL,
            CardData.CardType.TORAN_DARELL
        ]:
            has_conflict = true

    if has_first_speaker and has_conflict:
        # Auto-discard First Speaker
        for i in player.hand.size():
            if player.hand[i].card_type == CardData.CardType.FIRST_SPEAKER:
                var discarded = player.hand[i]
                player.hand.remove_at(i)
                player.discard_pile.append(discarded)
                print("⚠️ First Speaker auto-discarded!")
                break
```

**Player Class** (`scripts/autoload/game_manager.gd` or separate file):
```gdscript
class_name Player
extends RefCounted

var id: String = ""
var name: String = ""
var hand: Array[CardData] = []
var discard_pile: Array[CardData] = []
var devotion_tokens: int = 0
var is_protected: bool = false
var is_eliminated: bool = false
```

### 3. Card Database (Autoload Singleton)

**CardDatabase** (`scripts/autoload/card_database.gd`):
```gdscript
extends Node

# Preloaded card definitions
const CARD_DEFINITIONS = {
    CardData.CardType.INFORMANT: {
        "value": 1,
        "name": "Informant",
        "ability": "Name a character (not Informant). If another player has that card, they are eliminated.",
        "color": Color(0.15, 0.2, 0.25),  # Slate gray
        "icon": "👤",
        "quote": "I have reason to believe someone here is not who they claim...",
        "description": "The most common of the converted",
        "count": 5
    },
    CardData.CardType.HAN_PRITCHER: {
        "value": 2,
        "name": "Han Pritcher",
        "ability": "Look at another player's hand.",
        "color": Color(0.1, 0.2, 0.4),  # Dark blue
        "icon": "🎖️",
        "quote": "Your position grants you no secrets from me...",
        "description": "The converted captain who believes his loyalty is freely chosen",
        "count": 1
    },
    # ... (remaining card definitions)
}

func create_deck() -> Array[CardData]:
    """Create a shuffled deck of all cards"""
    var deck: Array[CardData] = []
    var id_counter = 0

    for card_type in CARD_DEFINITIONS.keys():
        var def = CARD_DEFINITIONS[card_type]
        var count = def["count"]

        for i in range(count):
            var card = CardData.new()
            card.card_type = card_type
            card.value = def["value"]
            card.card_name = def["name"]
            card.ability = def["ability"]
            card.color = def["color"]
            card.icon = def["icon"]
            card.quote = def["quote"]
            card.description = def["description"]

            # Load random portrait variant (0-3)
            var variant = randi() % 4
            var type_name = CardData.CardType.keys()[card_type].to_lower().replace("_", "-")
            card.portrait = load("res://assets/cards/%s/portrait_%d.png" % [type_name, variant])

            card.instance_id = "%s-%d" % [type_name, id_counter]
            id_counter += 1

            deck.append(card)

    return deck

func get_card_definition(card_type: CardData.CardType) -> Dictionary:
    """Get definition for a specific card type"""
    return CARD_DEFINITIONS.get(card_type, {})
```

### 4. Card Effects System

**CardEffects** (`scripts/utils/card_effects.gd`):
```gdscript
class_name CardEffects
extends Node

static func apply_effect(game_state: Node, card: CardData, player_id: String, choice: Dictionary):
    """Apply the effect of a played card"""
    match card.card_type:
        CardData.CardType.INFORMANT:
            _apply_informant(game_state, player_id, choice)
        CardData.CardType.HAN_PRITCHER, CardData.CardType.BAIL_CHANNIS:
            _apply_look_at_hand(game_state, player_id, choice)
        CardData.CardType.EBLING_MIS, CardData.CardType.MAGNIFICO:
            _apply_compare_hands(game_state, player_id, choice)
        CardData.CardType.SHIELDED_MIND:
            _apply_protection(game_state, player_id)
        CardData.CardType.BAYTA_DARELL, CardData.CardType.TORAN_DARELL:
            _apply_force_discard(game_state, player_id, choice)
        CardData.CardType.MAYOR_INDBUR:
            _apply_trade_hands(game_state, player_id, choice)
        CardData.CardType.FIRST_SPEAKER:
            pass  # Auto-discard handled separately
        CardData.CardType.MULE:
            pass  # Effect triggers on discard (elimination)

static func _apply_informant(game_state: Node, player_id: String, choice: Dictionary):
    var target_player_id = choice.get("target_player", "")
    var guessed_type = choice.get("guessed_card_type", -1)

    var target_player = _get_player_by_id(game_state, target_player_id)
    if not target_player or target_player.is_protected:
        return

    # Check if target has the guessed card
    for card in target_player.hand:
        if card.card_type == guessed_type:
            target_player.is_eliminated = true
            game_state.player_eliminated.emit(target_player_id)
            print("💀 %s eliminated by Informant!" % target_player.name)
            return

static func _apply_protection(game_state: Node, player_id: String):
    var player = _get_player_by_id(game_state, player_id)
    if player:
        player.is_protected = true
        print("🛡️ %s is protected!" % player.name)

static func _get_player_by_id(game_state: Node, player_id: String) -> Player:
    for player in game_state.players:
        if player.id == player_id:
            return player
    return null

# ... (implement remaining effect functions)
```

### 5. UI Scene Structure

**GameBoard Scene** (`scenes/game_board.tscn` + `game_board.gd`):
```gdscript
class_name GameBoard
extends Control

@onready var phase_label: Label = $CenterArea/PhaseLabel
@onready var deck_display: TextureRect = $CenterArea/DeckDisplay
@onready var players_container: GridContainer = $PlayersContainer

func _ready():
    # Connect to GameManager signals
    GameManager.phase_changed.connect(_on_phase_changed)
    GameManager.round_ended.connect(_on_round_ended)

    # Initialize player areas
    _create_player_areas(GameManager.players.size())

    # Initial UI update
    _update_ui()

func _on_phase_changed(new_phase: GameManager.Phase):
    phase_label.text = _get_phase_name(new_phase)
    _update_ui()

func _update_ui():
    # Update deck count
    var deck_count = GameManager.deck.size()
    deck_display.get_node("CountLabel").text = str(deck_count)

    # Update player areas
    for i in players_container.get_child_count():
        var player_area = players_container.get_child(i)
        player_area.update_display(GameManager.players[i])

func _create_player_areas(player_count: int):
    var player_area_scene = preload("res://scenes/player/player_area.tscn")

    for i in range(player_count):
        var player_area = player_area_scene.instantiate()
        player_area.player_index = i
        players_container.add_child(player_area)

func _get_phase_name(phase: GameManager.Phase) -> String:
    match phase:
        GameManager.Phase.SETUP: return "Setup"
        GameManager.Phase.DRAW: return "Draw Phase"
        GameManager.Phase.PLAY: return "Play Phase"
        GameManager.Phase.ROUND_END: return "Round End"
        GameManager.Phase.GAME_END: return "Game Over"
        _: return "Unknown"
```

## Testing Strategy

### Testing Frameworks for Godot

**Recommended: gdUnit4** (most feature-complete for Godot 4.5)

Install via Godot Asset Library:
1. Open Godot Editor → AssetLib
2. Search for "gdUnit4"
3. Download and install

**Example Test** (`tests/unit/test_game_manager.gd`):
```gdscript
extends GdUnitTestSuite

var game_manager: Node

func before_test():
    game_manager = auto_free(load("res://scripts/autoload/game_manager.gd").new())

func test_initialize_game_creates_correct_player_count():
    game_manager.initialize_game(4)
    assert_that(game_manager.players.size()).is_equal(4)

func test_tokens_to_win_correct_for_player_count():
    game_manager.initialize_game(2)
    assert_that(game_manager.tokens_to_win).is_equal(7)

    game_manager.initialize_game(3)
    assert_that(game_manager.tokens_to_win).is_equal(5)

    game_manager.initialize_game(4)
    assert_that(game_manager.tokens_to_win).is_equal(4)

func test_deck_creation_has_16_cards():
    var deck = CardDatabase.create_deck()
    assert_that(deck.size()).is_equal(16)

func test_round_initialization_removes_correct_cards():
    game_manager.initialize_game(2)
    # 2-player: 16 cards - 3 removed - 2 dealt = 11 remaining
    assert_that(game_manager.deck.size()).is_equal(11)
    assert_that(game_manager.removed_card).is_not_null()

func test_draw_card_changes_phase_to_play():
    game_manager.initialize_game(2)
    game_manager.current_phase = GameManager.Phase.DRAW
    game_manager.draw_card()
    assert_that(game_manager.current_phase).is_equal(GameManager.Phase.PLAY)

func test_player_elimination_reduces_active_players():
    game_manager.initialize_game(3)
    game_manager.players[0].is_eliminated = true
    var active = game_manager.players.filter(func(p): return not p.is_eliminated)
    assert_that(active.size()).is_equal(2)
```

**Running Tests:**
```bash
# From Godot Editor
# Bottom panel → "GdUnit4" tab → "Run Tests"

# From command line (CI/CD)
godot --headless -s addons/gdUnit4/bin/GdUnit4CmdTool.gd --test-path tests/
```

## Development Workflow with Claude Code

### How Claude Code Should Work with Godot Projects

**Key Differences from Web Development:**

1. **No npm/build commands** - Godot handles builds internally
2. **Scene files are binary** - `.tscn` files are text-based but structured; edit via Godot Editor when possible
3. **Testing is manual or via gdUnit4** - No Jest/Vitest equivalents
4. **Git workflow stays the same** - GitButler still manages commits via MCP tool

### Recommended Workflow

#### When Planning Features
```bash
# Use code-architect agent for architecture planning
/code-architect "Design the card interaction modal system in Godot"
```

#### When Implementing Features
1. **Create scenes visually in Godot Editor** (when UI-heavy)
2. **Claude Code writes GDScript logic** (card effects, game state, etc.)
3. **Test in Godot Editor** (run scene with F6, full game with F5)
4. **Write unit tests** (using gdUnit4)
5. **Record work via GitButler MCP**

#### Code Review and Testing
```bash
# Use test-writer-fixer for test coverage
# Use code-reviewer for quality checks
# Use debugger for troubleshooting
```

### File Operations Best Practices

**Claude Code CAN:**
- Write `.gd` script files (GDScript code)
- Create resource definitions (`.gd` extending `Resource`)
- Write test files (`test_*.gd`)
- Edit `project.godot` for autoloads and settings
- Create folder structures

**Claude Code SHOULD AVOID:**
- Directly editing `.tscn` scene files (use Godot Editor instead)
- Modifying `.import` files (auto-generated)
- Touching `.godot/` folder (always ignored)

### Example Claude Code Session

```markdown
User: "Implement the Informant card effect in Godot"

Claude: I'll implement the Informant card effect. Let me create a todo list:
- Write Informant effect function in CardEffects
- Add target selection modal scene
- Write unit tests for Informant logic

[Writes CardEffects._apply_informant() function]
[Creates CardInteractionModal scene guidance]
[Writes test_informant_effect.gd]

Use GameManager.play_card() with choice: {"target_player": "player_1", "guessed_card_type": CardData.CardType.MULE}

Then call gitbutler_update_branches MCP tool:
- fullPrompt: "Implement the Informant card effect in Godot"
- changesSummary: "Added Informant card effect to CardEffects, created interaction modal structure, added unit tests"
```

## Migration Roadmap

### Phase 1: Core Game Logic (Week 1-2)
- [x] Set up Godot project structure
- [ ] Create CardData resource class
- [ ] Implement CardDatabase autoload
- [ ] Implement GameManager autoload with all game state
- [ ] Write Player class
- [ ] Implement deck creation, shuffling, dealing
- [ ] Write unit tests for all game logic
- [ ] Verify phase transitions work correctly

**Success Criteria:**
- All game rules implemented and tested
- State management working without UI
- Test coverage >80% for game logic

### Phase 2: UI Implementation (Week 3-4)
- [ ] Create Card scene (front/back visual)
- [ ] Create PlayerArea scene (hand, discard, tokens)
- [ ] Create GameBoard scene (main game view)
- [ ] Create PlayerSelect scene (2-4 players)
- [ ] Implement card interaction modals
- [ ] Add basic animations (card dealing, playing)
- [ ] Connect UI to GameManager signals

**Success Criteria:**
- Full game playable with basic UI
- All card interactions functional
- Responsive layout for different screen sizes

### Phase 3: Polish and Visual Effects (Week 5-6)
- [ ] Add card animations (flip, slide, fade)
- [ ] Implement particle effects (elimination, devotion token award)
- [ ] Add sound effects (card play, shuffle, win)
- [ ] Create card ability visualization (tooltips, highlights)
- [ ] Add player turn indicators
- [ ] Implement game history log
- [ ] Polish UI theming (Foundation-inspired aesthetic)

**Success Criteria:**
- Game feels polished and responsive
- Visual feedback for all actions
- Thematic consistency with Foundation universe

### Phase 4: Testing and Export (Week 7)
- [ ] Write integration tests for full game flow
- [ ] Manual QA testing (all card combinations)
- [ ] Performance optimization (if needed)
- [ ] Export to desktop (Windows, macOS, Linux)
- [ ] Export to web (HTML5 via WebGL/WebGPU)
- [ ] Create build pipeline (CI/CD)

**Success Criteria:**
- All tests passing
- Builds working on all target platforms
- No known critical bugs

## GDScript Best Practices

### Code Style Guidelines

```gdscript
# Use snake_case for variables and functions
var player_count: int = 4
func initialize_game():
    pass

# Use PascalCase for classes and enums
class_name CardData
enum Phase { SETUP, DRAW, PLAY }

# Type hints everywhere (GDScript 2.0 static typing)
var cards: Array[CardData] = []
func get_player(id: String) -> Player:
    return players[0]

# Use @export for inspector-editable properties
@export var max_players: int = 4
@export_range(1, 10) var round_limit: int = 5

# Use @onready for node references (initialized in _ready())
@onready var label: Label = $Label
@onready var sprite: Sprite2D = $Sprite2D

# Signals at top of script
signal card_played(card: CardData)
signal player_eliminated(player_id: String)

# Constants in UPPER_SNAKE_CASE
const MAX_HAND_SIZE: int = 2
const TOKENS_TO_WIN_2P: int = 7

# Document complex functions
## Applies the effect of a played card to the game state
## @param game_state: Current game state node
## @param card: The card being played
## @return: Updated game state
func apply_card_effect(game_state: Node, card: CardData) -> Node:
    pass
```

### Signal Best Practices

```gdscript
# Define signals at class level
signal phase_changed(new_phase: Phase)
signal card_drawn(player_id: String, card: CardData)

# Emit signals after state changes
func change_phase(new_phase: Phase):
    current_phase = new_phase
    phase_changed.emit(new_phase)

# Connect in _ready() or programmatically
func _ready():
    GameManager.phase_changed.connect(_on_phase_changed)
    card_button.pressed.connect(_on_card_button_pressed)

# Use lambda for one-off connections
func connect_temporary_signal():
    button.pressed.connect(func(): print("Clicked!"))
```

### Resource Management

```gdscript
# Preload resources at compile time (constants)
const CARD_SCENE = preload("res://scenes/card/card.tscn")

# Load at runtime (dynamic)
var portrait = load("res://assets/cards/mule/portrait_0.png")

# Always free manually-created nodes
var temp_node = Node.new()
add_child(temp_node)
# ... use it ...
temp_node.queue_free()  # Or remove_child() then free()

# Use auto_free() in tests (gdUnit4)
var test_node = auto_free(Node.new())
```

## GitButler Integration

### Godot-Specific .gitignore

Already covered in Quick Start, but critical reminders:

```gitignore
# NEVER commit these
.godot/          # Editor cache/metadata
.import/         # Legacy Godot 3.x imports
*.translation    # Auto-generated from CSV

# Usually ignore (project-specific)
export_presets.cfg  # May contain sensitive export settings
export.cfg

# OS/Editor
.DS_Store
.vscode/
.idea/
```

### Using GitButler MCP Tool

After making changes in Godot (scripts, scenes, resources):

```bash
# GitButler hooks will detect file changes
# When ready to commit via Claude Code:

mcp__gitbutler__gitbutler_update_branches(
    fullPrompt: "Implement card draw phase and First Speaker auto-discard logic",
    changesSummary: """
        - Added draw_card() method to GameManager
        - Implemented _check_first_speaker_auto_discard() logic
        - Created unit tests for draw phase transitions
        - Updated GameBoard UI to show current phase
    """,
    currentWorkingDirectory: "/path/to/the-mules-court-godot"
)
```

### Git Commands to NEVER Use
- `git commit` - GitButler handles commits
- `git checkout` - Breaks GitButler branch management
- `git rebase` - Conflicts with GitButler stacking
- `git merge` - Use GitButler UI

### Safe Git Commands
- `git status` - Check current state
- `git diff` - See uncommitted changes
- `git log` - View commit history
- `git branch` - List branches (but don't switch!)

## Common Pitfalls and Solutions

### Pitfall 1: Modifying Scene Files Directly
**Problem:** Editing `.tscn` files in text editor breaks scene structure
**Solution:** Always use Godot Editor for scene modifications; Claude Code writes scripts only

### Pitfall 2: Forgetting Type Hints
**Problem:** Losing static typing benefits, harder to debug
**Solution:** Always use type hints: `var cards: Array[CardData]`, `func get_player() -> Player`

### Pitfall 3: Not Using Signals
**Problem:** Tight coupling between components, hard to maintain
**Solution:** Use signals for all cross-node communication (e.g., `GameManager.phase_changed.emit()`)

### Pitfall 4: Ignoring _ready() Order
**Problem:** Accessing nodes before they're ready causes errors
**Solution:** Use `@onready` for node references, check `is_node_ready()` if needed

### Pitfall 5: Memory Leaks with Nodes
**Problem:** Manually created nodes never freed
**Solution:** Always call `queue_free()` on dynamic nodes, use `auto_free()` in tests

## Resources and Documentation

### Official Godot Documentation
- **Main Docs:** https://docs.godotengine.org/en/stable/
- **GDScript Reference:** https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/index.html
- **2D Game Tutorial:** https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html
- **Best Practices:** https://docs.godotengine.org/en/stable/tutorials/best_practices/index.html

### Testing Frameworks
- **gdUnit4:** https://mikeschulze.github.io/gdUnit4/
- **GUT:** https://github.com/bitwes/Gut

### Card Game Frameworks
- **Godot Card Game Framework:** https://github.com/db0/godot-card-game-framework

### Community
- **Godot Forum:** https://forum.godotengine.org/
- **Reddit:** r/godot
- **Discord:** https://discord.gg/godotengine

## Conclusion

This guide provides everything needed to successfully migrate The Mule's Court from React + BabylonJS to Godot 4.5. The key advantages:

1. **Simpler architecture** - No fighting with web rendering, native game development
2. **Visual tooling** - Godot Editor for scenes and UI, faster iteration
3. **Better suited for games** - Built-in animation, signals, resource management
4. **Claude Code friendly** - Clear separation of scripts (AI-editable) and scenes (editor-managed)

Follow the migration roadmap phase by phase, use the provided code examples as templates, and leverage Godot's powerful built-in systems to create a polished card game experience.

**When ready to start, create a new Godot project, copy this guide as `CLAUDE.md` in the project root, and begin Phase 1: Core Game Logic.**

---

**This document should serve as the primary reference for Claude Code when working on The Mule's Court in Godot. Update it as the project evolves and patterns emerge.**
